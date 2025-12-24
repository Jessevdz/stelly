from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, func
from app.db.session import get_db
from app.db.models import (
    Tenant,
    MenuItem,
    Order,
    Category,
    ModifierGroup,
    ModifierOption,
)
from app.schemas.menu import CategoryWithItems
from app.core.socket import manager
from app.core.ratelimit import RateLimiter
from app.core.config import settings
from app.api.v1.deps import get_current_user  # Need this to parse token safely
from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import datetime
from uuid import UUID
from jose import jwt, JWTError  # Need low-level decode for initial tenant resolution

router = APIRouter()
# --- Config Schemas ---


class OperatingHour(BaseModel):
    label: str
    time: str


class TenantConfigResponse(BaseModel):
    name: str
    primary_color: str
    font_family: str = "Inter"
    currency: str = "$"
    preset: str = "mono-luxe"
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    operating_hours: List[OperatingHour] = []


class OrderModifierSchema(BaseModel):
    optionId: UUID


class OrderItemSchema(BaseModel):
    id: UUID
    qty: int
    modifiers: List[OrderModifierSchema] = []


class OrderCreateRequest(BaseModel):
    customer_name: str
    table_number: Optional[str] = None
    items: List[OrderItemSchema]


class OrderResponse(BaseModel):
    id: str
    ticket_number: int
    status: str
    message: str
    total_amount: int


class OrderDetail(BaseModel):
    id: UUID
    ticket_number: int
    customer_name: str
    table_number: Optional[str] = None
    status: str
    total_amount: int
    items: List[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: Literal["PENDING", "QUEUED", "PREPARING", "READY", "COMPLETED"]


# --- UPDATED HELPER ---
def resolve_tenant_context(request: Request, db: Session) -> Tenant:
    """
    Determines the correct Tenant/Schema to use.
    Prioritizes Auth Token 'target_schema' for Demo isolation.
    """
    host = request.headers.get("host", "").split(":")[0]

    # 1. Check for Authorization Header (Magic Token Override)
    auth_header = request.headers.get("Authorization")
    target_schema = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            # We decoded crudely here just to get the schema claim quickly
            # Security verification happens in `get_current_user` dependency usually,
            # but for tenant resolution strictly, this is acceptable if we fallback safely.
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            target_schema = payload.get("target_schema")
        except JWTError:
            pass  # Invalid token, fall back to host resolution

    # 2. Logic for Demo Domain
    if host == settings.DEMO_DOMAIN:
        # If we found a specific schema in the token, return a virtual tenant object
        if target_schema:
            # Ensure we are in public to read the base config, OR just use the ephemeral schema
            # We need to construct a Tenant object that points to this schema
            return Tenant(
                name="Demo Session",
                domain=host,
                schema_name=target_schema,
                theme_config={},  # Config is fetched separately usually
            )

        # Fallback: The generic read-only demo tenant
        db.execute(text("SET search_path TO public"))
        tenant = (
            db.query(Tenant).filter(Tenant.schema_name == settings.DEMO_SCHEMA).first()
        )
        if not tenant:
            # Should be seeded
            raise HTTPException(status_code=500, detail="Generic demo tenant missing.")
        return tenant

    # 3. Standard Logic (Subdomains/Custom Domains)
    db.execute(text("SET search_path TO public"))
    tenant = db.query(Tenant).filter(Tenant.domain == host).first()
    if not tenant:
        raise HTTPException(status_code=404, detail=f"No tenant found for: {host}")

    return tenant


# --- Endpoints ---


@router.get("/config", response_model=TenantConfigResponse)
def get_store_config(request: Request, db: Session = Depends(get_db)):
    # Config is tricky because ephemeral sessions might not have a full row in 'public.tenants'
    # IF you created a row in sys.py (which we did), this works.

    # 1. Resolve Schema
    tenant_context = resolve_tenant_context(request, db)

    # 2. Fetch Config from Public Table
    db.execute(text("SET search_path TO public"))

    # We query by schema_name because the 'id' might be virtual/unknown in the context object
    real_tenant = (
        db.query(Tenant)
        .filter(Tenant.schema_name == tenant_context.schema_name)
        .first()
    )

    # Fallback for generic demo if token schema not found (e.g. expired session)
    if not real_tenant and tenant_context.schema_name.startswith("demo_"):
        # Try fetching the generic demo config so the UI doesn't crash
        real_tenant = (
            db.query(Tenant).filter(Tenant.schema_name == settings.DEMO_SCHEMA).first()
        )

    if not real_tenant:
        return TenantConfigResponse(name="Store Not Found", primary_color="#000")

    theme = real_tenant.theme_config or {}

    default_hours = [
        {"label": "Mon - Fri", "time": "11:00 AM - 10:00 PM"},
        {"label": "Sat - Sun", "time": "10:00 AM - 11:00 PM"},
    ]

    return TenantConfigResponse(
        name=real_tenant.name,
        primary_color=theme.get("primary_color", "#000000"),
        font_family=theme.get("font_family", "Inter"),
        preset=theme.get("preset", "mono-luxe"),
        address=theme.get("address", "123 Culinary Avenue"),
        phone=theme.get("phone", "(555) 123-4567"),
        email=theme.get("email", "hello@example.com"),
        operating_hours=theme.get("operating_hours", default_hours),
    )


@router.get("/menu", response_model=List[CategoryWithItems])
def get_store_menu(request: Request, db: Session = Depends(get_db)):
    tenant = resolve_tenant_context(request, db)

    # Switch to specific schema
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    categories = (
        db.query(Category)
        .options(
            joinedload(Category.items)
            .joinedload(MenuItem.modifier_groups)
            .joinedload(ModifierGroup.options)
        )
        .order_by(Category.rank.asc())
        .all()
    )
    return categories


# --- New KDS Endpoints ---


@router.get("/orders", response_model=List[OrderDetail])
def get_active_orders(request: Request, db: Session = Depends(get_db)):
    """
    Fetch active orders for the KDS (Persistence).
    """
    tenant = resolve_tenant_context(request, db)
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    orders = (
        db.query(Order)
        .filter(Order.status.in_(["PENDING", "QUEUED", "PREPARING", "READY"]))
        .order_by(Order.created_at.asc())
        .all()
    )
    return orders


@router.put("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Update order status and sync via WebSocket.
    """
    tenant = resolve_tenant_context(request, db)

    # 1. Initial Context Set
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    db.commit()

    # Re-apply schema context because commit() resets transaction state
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))
    db.refresh(order)

    # Broadcast using the SPECIFIC schema name
    await manager.broadcast_to_tenant(
        tenant.schema_name,
        {
            "event": "order_update",
            "order": {"id": str(order.id), "status": order.status},
        },
    )

    return OrderResponse(
        id=str(order.id),
        ticket_number=order.ticket_number,
        status=order.status,
        message=f"Order marked as {payload.status}",
        total_amount=order.total_amount,
    )


@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=201,
    dependencies=[Depends(RateLimiter(times=20, seconds=600))],
)
async def create_store_order(
    payload: OrderCreateRequest, request: Request, db: Session = Depends(get_db)
):
    """
    Creates an order with SERVER-SIDE price calculation and Daily Ticket #.
    """
    # 1. Resolve Tenant (Crucial for Demo Isolation)
    tenant = resolve_tenant_context(request, db)

    # 2. Set Context
    schema_context_sql = text(f"SET search_path TO {tenant.schema_name}, public")
    db.execute(schema_context_sql)

    # 3. Calculate Daily Ticket Number
    today_start = datetime.utcnow().date()
    last_order = (
        db.query(Order.ticket_number)
        .filter(func.date(Order.created_at) == today_start)
        .order_by(Order.ticket_number.desc())
        .first()
    )
    next_ticket_num = (last_order[0] + 1) if last_order else 1

    # 4. Fetch Items & Modifiers (unchanged logic)
    item_ids = [item.id for item in payload.items]
    modifier_ids = [mod.optionId for item in payload.items for mod in item.modifiers]

    db_items = db.query(MenuItem).filter(MenuItem.id.in_(item_ids)).all()
    items_map = {item.id: item for item in db_items}

    db_modifiers = (
        db.query(ModifierOption).filter(ModifierOption.id.in_(modifier_ids)).all()
    )
    mods_map = {mod.id: mod for mod in db_modifiers}

    grand_total = 0
    items_snapshot = []

    for item_in in payload.items:
        db_item = items_map.get(item_in.id)
        if not db_item:
            continue

        item_total_cents = db_item.price
        modifiers_snapshot = []
        for mod_in in item_in.modifiers:
            db_mod = mods_map.get(mod_in.optionId)
            if db_mod:
                item_total_cents += db_mod.price_adjustment
                modifiers_snapshot.append(
                    {
                        "id": str(db_mod.id),
                        "name": db_mod.name,
                        "price": db_mod.price_adjustment,
                    }
                )

        line_total = item_total_cents * item_in.qty
        grand_total += line_total

        items_snapshot.append(
            {
                "id": str(db_item.id),
                "name": db_item.name,
                "qty": item_in.qty,
                "price_snapshot": db_item.price,
                "modifiers": modifiers_snapshot,
                "line_total": line_total,
            }
        )

    if grand_total == 0 and not items_snapshot:
        raise HTTPException(status_code=400, detail="Order cannot be empty")

    new_order = Order(
        ticket_number=next_ticket_num,
        customer_name=payload.customer_name,
        table_number=payload.table_number,
        total_amount=grand_total,
        items=items_snapshot,
        status="PENDING",
    )

    db.add(new_order)

    try:
        db.commit()
        db.execute(schema_context_sql)  # Re-apply context
        db.refresh(new_order)

        order_data = {
            "id": str(new_order.id),
            "ticket_number": new_order.ticket_number,
            "customer_name": new_order.customer_name,
            "table_number": new_order.table_number,
            "total_amount": new_order.total_amount,
            "items": new_order.items,
            "status": new_order.status,
            "created_at": str(new_order.created_at),
        }
    except Exception as e:
        db.rollback()
        print(f"Order Placement Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to place order: {e}")

    # 5. Broadcast to the ISOLATED schema channel
    await manager.broadcast_to_tenant(
        tenant.schema_name,
        {
            "event": "new_order",
            "order": order_data,
        },
    )

    return OrderResponse(
        id=str(new_order.id),
        ticket_number=new_order.ticket_number,
        status=new_order.status,
        message="Order placed successfully",
        total_amount=new_order.total_amount,
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order_status(order_id: str, request: Request, db: Session = Depends(get_db)):
    tenant = resolve_tenant_context(request, db)
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    try:
        oid = UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Order ID format")

    order = db.query(Order).filter(Order.id == oid).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    return OrderResponse(
        id=str(order.id),
        ticket_number=order.ticket_number,
        status=order.status,
        message="Status retrieved",
        total_amount=order.total_amount,
    )
