import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    JSON,
    ForeignKey,
    Text,
    DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

# --- PUBLIC SCHEMA MODELS ---


class Tenant(Base):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    schema_name = Column(String, unique=True, nullable=False)
    domain = Column(String, unique=True, nullable=False)
    theme_config = Column(JSON, default={})


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    assigned_schema = Column(
        String, nullable=False
    )  # The ephemeral schema (e.g. demo_xyz)
    created_at = Column(DateTime, default=datetime.utcnow)


# --- TENANT SCHEMA MODELS ---
# (Keep User, Category, MenuItem, ModifierGroup, ModifierOption, Order exactly as they were)
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="admin")


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    rank = Column(Integer, default=0)

    items = relationship(
        "MenuItem", back_populates="category", cascade="all, delete-orphan"
    )


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Integer, nullable=False)  # In cents
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)
    rank = Column(Integer, default=0)

    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    category = relationship("Category", back_populates="items")

    modifier_groups = relationship(
        "ModifierGroup", back_populates="item", cascade="all, delete-orphan"
    )


class ModifierGroup(Base):
    __tablename__ = "modifier_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id = Column(UUID(as_uuid=True), ForeignKey("menu_items.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g. "Size", "Toppings"
    min_selection = Column(Integer, default=0)  # 0=Optional, 1=Required
    max_selection = Column(Integer, default=1)  # 1=Radio, >1=Checkbox

    item = relationship("MenuItem", back_populates="modifier_groups")
    options = relationship(
        "ModifierOption", back_populates="group", cascade="all, delete-orphan"
    )


class ModifierOption(Base):
    __tablename__ = "modifier_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(
        UUID(as_uuid=True), ForeignKey("modifier_groups.id"), nullable=False
    )
    name = Column(String, nullable=False)  # e.g. "Small", "Extra Cheese"
    price_adjustment = Column(Integer, default=0)  # In cents

    group = relationship("ModifierGroup", back_populates="options")


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 1. Fulfillment Details
    customer_name = Column(String, nullable=False)
    table_number = Column(String, nullable=True)

    # 2. System Fields
    ticket_number = Column(Integer, nullable=False, default=1)
    status = Column(String, default="PENDING")
    total_amount = Column(Integer, nullable=False)
    items = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
