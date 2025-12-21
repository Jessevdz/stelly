from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Literal
from uuid import UUID

from app.db.session import get_db
from app.db.models import (
    Category,
    MenuItem,
    User,
    ModifierGroup,
    ModifierOption,
    Tenant,
)
from app.schemas.menu import (
    CategoryCreate,
    CategoryResponse,
    MenuItemCreate,
    MenuItemResponse,
    ModifierGroupCreate,
    ModifierGroupResponse,
)
from app.api.v1.deps import get_current_user
from pydantic import BaseModel
from sqlalchemy import text
from app.db.models import Tenant

router = APIRouter()

# --- Categories ---


@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(Category).order_by(Category.rank.asc()).all()


@router.post("/categories", response_model=CategoryResponse)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = Category(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}")
def delete_category(
    cat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return db.query(MenuItem).all()


@router.post("/items", response_model=MenuItemResponse)
def create_item(
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = MenuItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=MenuItemResponse)
def update_item(
    item_id: UUID,
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    for key, value in payload.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@router.post("/items/{item_id}/modifiers", response_model=ModifierGroupResponse)
def add_modifier_group(
    item_id: UUID,
    payload: ModifierGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a modifier group (and its options) to an item.
    """
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Create Group
    group = ModifierGroup(
        item_id=item_id,
        name=payload.name,
        min_selection=payload.min_selection,
        max_selection=payload.max_selection,
    )
    db.add(group)
    db.flush()  # Generate ID

    # Create Options
    for opt in payload.options:
        db.add(
            ModifierOption(
                group_id=group.id,
                name=opt.name,
                price_adjustment=opt.price_adjustment,
            )
        )

    db.commit()
    db.refresh(group)
    return group


@router.delete("/modifiers/{group_id}")
def delete_modifier_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(ModifierGroup).filter(ModifierGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Modifier group not found")

    db.delete(group)
    db.commit()
    return {"message": "Deleted"}


# --- Settings / Theme Config ---


class ThemeConfigSchema(BaseModel):
    preset: Literal["mono-luxe", "fresh-market", "tech-ocean"]
    primary_color: str
    font_family: str


@router.get("/settings", response_model=ThemeConfigSchema)
def get_tenant_settings(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch settings from the Public Tenant table based on the current host.
    """
    # 1. Resolve Tenant from Host (Same logic as deps, but we need the object)
    host = request.headers.get("host", "").split(":")[0]

    # We must switch to public schema to read the Tenant table
    db.execute(text("SET search_path TO public"))
    tenant = db.query(Tenant).filter(Tenant.domain == host).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant config not found")

    config = tenant.theme_config or {}

    # Switch back to tenant schema for safety (though request ends here)
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    return ThemeConfigSchema(
        preset=config.get("preset", "mono-luxe"),
        primary_color=config.get("primary_color", "#000000"),
        font_family=config.get("font_family", "Inter"),
    )


@router.put("/settings", response_model=ThemeConfigSchema)
def update_tenant_settings(
    payload: ThemeConfigSchema,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the public tenant record with new theme config.
    """
    host = request.headers.get("host", "").split(":")[0]

    # 1. Switch to Public to write
    db.execute(text("SET search_path TO public"))

    tenant = db.query(Tenant).filter(Tenant.domain == host).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # 2. Update Field
    # We use a shallow merge or replacement
    new_config = {
        "preset": payload.preset,
        "primary_color": payload.primary_color,
        "font_family": payload.font_family,
    }

    # SQLAlchemy JSON field update
    tenant.theme_config = new_config

    db.commit()
    db.refresh(tenant)

    # 3. Restore Context
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    return payload
