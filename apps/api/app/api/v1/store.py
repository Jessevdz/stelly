from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
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
from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import datetime
from uuid import UUID

router = APIRouter()


# --- Schemas ---
class TenantConfigResponse(BaseModel):
    name: str
    primary_color: str
    font_family: str = "Inter"
    currency: str = "$"
    preset: str = "mono-luxe"


# Input Schema for Modifiers
class OrderModifierSchema(BaseModel):
    optionId: UUID


class OrderItemSchema(BaseModel):
    id: UUID
    qty: int
    modifiers: List[OrderModifierSchema] = []


class OrderCreateRequest(BaseModel):
    customer_name: str
    items: List[OrderItemSchema]
    # We purposefully exclude total_amount from the input requirement.
    # If the client sends it, Pydantic will ignore it or we just won't use it.


class OrderResponse(BaseModel):
    id: str
    status: str
    message: str
    total_amount: int  # Return the authoritative total


# New Schema for KDS List
class OrderDetail(BaseModel):
    id: UUID
    customer_name: str
    status: str
    total_amount: int
    items: List[dict]  # Returns the JSON snapshot
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
    return TenantConfigResponse(
        name=tenant.name,
        primary_color=theme.get("primary_color", "#000000"),
        font_family=theme.get("font_family", "Inter"),
        preset=theme.get("preset", "mono-luxe"),
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
        status=order.status,
        message=f"Order marked as {payload.status}",
        total_amount=order.total_amount,
    )


@router.post("/orders", response_model=OrderResponse, status_code=201)
async def create_store_order(
    payload: OrderCreateRequest, request: Request, db: Session = Depends(get_db)
):
    """
    Creates an order with SERVER-SIDE price calculation.
    """
    tenant = get_tenant_by_host(request, db)
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    # 1. Fetch all referenced Menu Items and Modifiers in bulk
    item_ids = [item.id for item in payload.items]
    modifier_ids = [mod.optionId for item in payload.items for mod in item.modifiers]

    # Fetch Items
    db_items = db.query(MenuItem).filter(MenuItem.id.in_(item_ids)).all()
    items_map = {item.id: item for item in db_items}

    # Fetch Modifiers
    db_modifiers = (
        db.query(ModifierOption).filter(ModifierOption.id.in_(modifier_ids)).all()
    )
    mods_map = {mod.id: mod for mod in db_modifiers}

    # 2. Calculate Totals & Build Data Snapshot
    grand_total = 0
    items_snapshot = []

    for item_in in payload.items:
        db_item = items_map.get(item_in.id)
        if not db_item:
            # Skip invalid items or raise 400. Skipping for resilience.
            continue

        # Start with base price
        item_total_cents = db_item.price

        # Calculate Modifiers
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

        # Multiply by Quantity
        line_total = item_total_cents * item_in.qty
        grand_total += line_total

        # Create Snapshot Item (What we save to DB JSON)
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

    # 3. Create Order Record
    new_order = Order(
        customer_name=payload.customer_name,
        total_amount=grand_total,
        items=items_snapshot,  # Stores the JSON structure
        status="PENDING",
    )

    db.add(new_order)

    try:
        db.commit()
        db.refresh(new_order)

        # Prepare broadcast data
        order_data = {
            "id": str(new_order.id),
            "customer_name": new_order.customer_name,
            "total_amount": new_order.total_amount,
            "items": new_order.items,
            "status": new_order.status,
            "created_at": str(new_order.created_at),
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to place order: {e}")

    # 4. Broadcast new order
    await manager.broadcast_to_tenant(
        tenant.schema_name,
        {
            "event": "new_order",
            "order": order_data,
        },
    )

    return OrderResponse(
        id=str(new_order.id),
        status=new_order.status,
        message="Order placed successfully",
        total_amount=new_order.total_amount,
    )
