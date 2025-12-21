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
from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import datetime
from uuid import UUID

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
    # Contact Info
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    operating_hours: List[OperatingHour] = []


# --- Order Schemas ---


# Input Schema for Modifiers
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
    status: Literal["PENDING", "PREPARING", "READY", "COMPLETED"]


# --- Helpers ---
def get_tenant_by_host(request: Request, db: Session) -> Tenant:
    host = request.headers.get("host", "").split(":")[0]
    tenant = db.query(Tenant).filter(Tenant.domain == host).first()
    if not tenant:
        raise HTTPException(status_code=404, detail=f"No tenant found for: {host}")
    return tenant


# --- Endpoints ---


@router.get("/config", response_model=TenantConfigResponse)
def get_store_config(request: Request, db: Session = Depends(get_db)):
    tenant = get_tenant_by_host(request, db)
    theme = tenant.theme_config or {}

    default_hours = [
        {"label": "Mon - Fri", "time": "11:00 AM - 10:00 PM"},
        {"label": "Sat - Sun", "time": "10:00 AM - 11:00 PM"},
    ]

    return TenantConfigResponse(
        name=tenant.name,
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
    tenant = get_tenant_by_host(request, db)
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
    Only returns PENDING or PREPARING orders.
    """
    tenant = get_tenant_by_host(request, db)
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    orders = (
        db.query(Order)
        .filter(Order.status.in_(["PENDING", "PREPARING"]))
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
    tenant = get_tenant_by_host(request, db)
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = payload.status
    db.commit()

    # Broadcast status change to all connected KDS screens
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
    dependencies=[Depends(RateLimiter(times=3, seconds=600))],
)
async def create_store_order(
    payload: OrderCreateRequest, request: Request, db: Session = Depends(get_db)
):
    """
    Creates an order with SERVER-SIDE price calculation and Daily Ticket #.
    """
    tenant = get_tenant_by_host(request, db)
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    # 1. Logic to Calculate Daily Ticket Number
    # Get the start of the current day (UTC)
    today_start = datetime.utcnow().date()

    # Find the highest ticket number created today
    # We use a locking strategy or simple max query.
    # For MVP, simple max query + 1 is sufficient.
    last_order = (
        db.query(Order.ticket_number)
        .filter(func.date(Order.created_at) == today_start)
        .order_by(Order.ticket_number.desc())
        .first()
    )

    next_ticket_num = (last_order[0] + 1) if last_order else 1

    # 2. Fetch all referenced Menu Items and Modifiers in bulk (Existing Logic)
    item_ids = [item.id for item in payload.items]
    modifier_ids = [mod.optionId for item in payload.items for mod in item.modifiers]

    db_items = db.query(MenuItem).filter(MenuItem.id.in_(item_ids)).all()
    items_map = {item.id: item for item in db_items}

    db_modifiers = (
        db.query(ModifierOption).filter(ModifierOption.id.in_(modifier_ids)).all()
    )
    mods_map = {mod.id: mod for mod in db_modifiers}

    # 3. Calculate Totals (Existing Logic)
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

    # 4. Create Order Record with new fields
    new_order = Order(
        ticket_number=next_ticket_num,  # Saved
        customer_name=payload.customer_name,
        table_number=payload.table_number,  # Saved
        total_amount=grand_total,
        items=items_snapshot,
        status="PENDING",
    )

    db.add(new_order)

    try:
        db.commit()
        db.refresh(new_order)

        # Prepare broadcast data including Ticket # and Table
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
        raise HTTPException(status_code=500, detail=f"Failed to place order: {e}")

    # 5. Broadcast new order
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
    """
    Allow customers to poll the status of their specific order ID.
    UUID prevents easy enumeration/snooping of other orders.
    """
    tenant = get_tenant_by_host(request, db)
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    # Convert str to UUID for safe query
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
