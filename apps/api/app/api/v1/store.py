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
from typing import List, Literal
from datetime import datetime

router = APIRouter()


# --- Schemas ---
class TenantConfigResponse(BaseModel):
    name: str
    primary_color: str
    font_family: str = "Inter"
    currency: str = "$"
    preset: str = "mono-luxe"


class OrderItemSchema(BaseModel):
    id: str
    qty: int
    name: str


class OrderCreateRequest(BaseModel):
    customer_name: str
    items: List[OrderItemSchema]
    total_amount: int


class OrderResponse(BaseModel):
    id: str
    status: str
    message: str


# New Schema for KDS List
class OrderDetail(BaseModel):
    id: str
    customer_name: str
    status: str
    total_amount: int
    items: List[OrderItemSchema]
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
    )


@router.post("/orders", response_model=OrderResponse, status_code=201)
async def create_store_order(
    payload: OrderCreateRequest, request: Request, db: Session = Depends(get_db)
):
    tenant = get_tenant_by_host(request, db)
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    new_order = Order(
        customer_name=payload.customer_name,
        total_amount=payload.total_amount,
        items=[item.model_dump() for item in payload.items],
        status="PENDING",
        # created_at handled by DB default
    )

    db.add(new_order)

    try:
        db.flush()
        # Capture for broadcast
        order_data = {
            "id": str(new_order.id),
            "customer_name": new_order.customer_name,
            "total_amount": new_order.total_amount,
            "items": new_order.items,
            "status": new_order.status,
            "created_at": str(datetime.utcnow()),  # Approx time for immediate broadcast
        }
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to place order")

    # Broadcast new order
    await manager.broadcast_to_tenant(
        tenant.schema_name,
        {
            "event": "new_order",
            "order": order_data,
        },
    )

    return OrderResponse(
        id=order_data["id"],
        status=order_data["status"],
        message="Order placed successfully",
    )
