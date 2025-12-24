from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Literal, Optional
from uuid import UUID

from app.db.session import get_db
from app.db.models import (
    Category,
    MenuItem,
    ModifierGroup,
    ModifierOption,
    Tenant,
)
from app.schemas.menu import (
    CategoryCreate,
    CategoryResponse,
    CategoryReorder,
    MenuItemCreate,
    MenuItemResponse,
    ModifierGroupCreate,
    ModifierGroupResponse,
    MenuItemReorder,
)
from app.api.v1.deps import get_current_user
from app.core.config import settings
from pydantic import BaseModel
from sqlalchemy import text

router = APIRouter()


# --- Helper to restore context ---
def restore_tenant_context(db: Session, request: Request, current_user: dict):
    """
    Re-applies the search_path after a commit resets the transaction.
    """
    # Use the schema resolved by the dependency injection
    schema = current_user.get("schema", "public")
    db.execute(text(f"SET search_path TO {schema}, public"))


# --- Categories ---


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)
):
    # Note: deps.py sets the initial search_path.
    return db.query(Category).order_by(Category.rank.asc()).all()


@router.post("/categories", response_model=CategoryResponse)
def create_category(
    request: Request,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    cat = Category(**payload.model_dump())
    db.add(cat)

    db.commit()
    # Transaction closed. Re-apply context before refresh.
    restore_tenant_context(db, request, current_user)
    db.refresh(cat)
    return cat


@router.put("/categories/reorder")
def reorder_categories(
    payload: List[CategoryReorder],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Batch update category ranks.
    """
    updates_map = {item.id: item.rank for item in payload}
    categories = db.query(Category).filter(Category.id.in_(updates_map.keys())).all()

    for cat in categories:
        if cat.id in updates_map:
            cat.rank = updates_map[cat.id]

    db.commit()
    return {"message": "Categories reordered successfully"}


@router.delete("/categories/{cat_id}")
def delete_category(
    cat_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"message": "Deleted"}


# --- Menu Items ---
@router.get("/items", response_model=List[MenuItemResponse])
def list_items(
    db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)
):
    return db.query(MenuItem).order_by(MenuItem.rank.asc()).all()


@router.post("/items", response_model=MenuItemResponse)
def create_item(
    request: Request,
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    item = MenuItem(**payload.model_dump())
    db.add(item)

    db.commit()
    restore_tenant_context(db, request, current_user)
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=MenuItemResponse)
def update_item(
    request: Request,
    item_id: UUID,
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    for key, value in payload.model_dump().items():
        setattr(item, key, value)

    db.commit()
    restore_tenant_context(db, request, current_user)
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}


@router.post("/items/{item_id}/modifiers", response_model=ModifierGroupResponse)
def add_modifier_group(
    request: Request,
    item_id: UUID,
    payload: ModifierGroupCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    group = ModifierGroup(
        item_id=item_id,
        name=payload.name,
        min_selection=payload.min_selection,
        max_selection=payload.max_selection,
    )
    db.add(group)
    db.flush()

    for opt in payload.options:
        db.add(
            ModifierOption(
                group_id=group.id,
                name=opt.name,
                price_adjustment=opt.price_adjustment,
            )
        )

    db.commit()
    restore_tenant_context(db, request, current_user)
    db.refresh(group)
    return group


@router.delete("/modifiers/{group_id}")
def delete_modifier_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    group = db.query(ModifierGroup).filter(ModifierGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Modifier group not found")

    db.delete(group)
    db.commit()
    return {"message": "Deleted"}


# --- Settings / Theme Config ---


class OperatingHour(BaseModel):
    label: str
    time: str


class ThemeConfigSchema(BaseModel):
    preset: Literal["mono-luxe", "fresh-market", "tech-ocean"]
    primary_color: str
    font_family: str
    address: Optional[str] = "123 Culinary Avenue"
    phone: Optional[str] = "(555) 123-4567"
    email: Optional[str] = "hello@example.com"
    operating_hours: List[OperatingHour] = []


@router.get("/settings", response_model=ThemeConfigSchema)
def get_tenant_settings(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # This endpoint needs to find the Public Tenant record that corresponds to the
    # current schema context.

    current_schema = current_user.get("schema")

    # Switch to public to read Tenant config
    db.execute(text("SET search_path TO public"))

    tenant = db.query(Tenant).filter(Tenant.schema_name == current_schema).first()

    if not tenant:
        # Fallback just in case something went wrong with the session mapping
        # Return default config so the UI doesn't crash
        return ThemeConfigSchema(
            preset="mono-luxe", primary_color="#000000", font_family="Inter"
        )

    config = tenant.theme_config or {}

    # Restore context
    db.execute(text(f"SET search_path TO {current_schema}, public"))

    default_hours = [
        {"label": "Mon - Fri", "time": "11:00 AM - 10:00 PM"},
        {"label": "Sat - Sun", "time": "10:00 AM - 11:00 PM"},
    ]

    return ThemeConfigSchema(
        preset=config.get("preset", "mono-luxe"),
        primary_color=config.get("primary_color", "#000000"),
        font_family=config.get("font_family", "Inter"),
        address=config.get("address", "123 Culinary Avenue"),
        phone=config.get("phone", "(555) 123-4567"),
        email=config.get("email", "hello@example.com"),
        operating_hours=config.get("operating_hours", default_hours),
    )


@router.put("/settings", response_model=ThemeConfigSchema)
def update_tenant_settings(
    payload: ThemeConfigSchema,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    current_schema = current_user.get("schema")

    db.execute(text("SET search_path TO public"))

    tenant = db.query(Tenant).filter(Tenant.schema_name == current_schema).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant config not found")

    hours_data = [h.model_dump() for h in payload.operating_hours]

    new_config = {
        "preset": payload.preset,
        "primary_color": payload.primary_color,
        "font_family": payload.font_family,
        "address": payload.address,
        "phone": payload.phone,
        "email": payload.email,
        "operating_hours": hours_data,
    }

    tenant.theme_config = new_config

    db.commit()
    db.refresh(tenant)

    db.execute(text(f"SET search_path TO {current_schema}, public"))

    return payload
