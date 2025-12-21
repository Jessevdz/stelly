from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID


# --- Modifier Schemas ---


class ModifierOptionBase(BaseModel):
    name: str
    price_adjustment: int = 0


class ModifierOptionCreate(ModifierOptionBase):
    pass


class ModifierOptionResponse(ModifierOptionBase):
    id: UUID

    class Config:
        from_attributes = True


class ModifierGroupBase(BaseModel):
    name: str
    min_selection: int = 0
    max_selection: int = 1


class ModifierGroupCreate(ModifierGroupBase):
    options: List[ModifierOptionCreate] = []


class ModifierGroupResponse(ModifierGroupBase):
    id: UUID
    options: List[ModifierOptionResponse] = []

    class Config:
        from_attributes = True


# --- Category Schemas ---


class CategoryBase(BaseModel):
    name: str
    rank: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: UUID

    class Config:
        from_attributes = True


# --- Item Schemas ---


class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: int
    image_url: Optional[str] = None
    is_available: bool = True
    category_id: Optional[UUID] = None


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemResponse(MenuItemBase):
    id: UUID
    modifier_groups: List[ModifierGroupResponse] = []

    class Config:
        from_attributes = True


# --- Nested Response for Storefront ---


class CategoryWithItems(CategoryResponse):
    items: List[MenuItemResponse] = []
