from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.db.models import Tenant, MenuItem
from pydantic import BaseModel
from typing import List

router = APIRouter()


# --- Schemas ---
class TenantConfigResponse(BaseModel):
    name: str
    primary_color: str
    currency: str = "$"


class MenuItemResponse(BaseModel):
    id: str
    name: str
    price: int
    is_available: bool

    class Config:
        from_attributes = True


# --- Helpers ---
def get_tenant_by_host(request: Request, db: Session) -> Tenant:
    """
    Resolves the tenant based on the Host header.
    In a real app, this might be cached via Redis.
    """
    host = request.headers.get("host", "").split(":")[0]  # Strip port

    # 1. Try to find by Custom Domain (priority) or specific domain
    # For MVP local testing, we assume the 'domain' column matches the Host header
    tenant = db.query(Tenant).filter(Tenant.domain == host).first()

    if not tenant:
        raise HTTPException(
            status_code=404, detail=f"No tenant found for domain: {host}"
        )

    return tenant


# --- Endpoints ---


@router.get("/config", response_model=TenantConfigResponse)
def get_store_config(request: Request, db: Session = Depends(get_db)):
    """
    Returns the branding configuration for the current domain.
    Does NOT require schema switching (reads from public.tenants).
    """
    tenant = get_tenant_by_host(request, db)

    # Extract theme config with fallbacks
    theme = tenant.theme_config or {}
    primary_color = theme.get("primary_color", "#000000")

    return TenantConfigResponse(name=tenant.name, primary_color=primary_color)


@router.get("/menu", response_model=List[MenuItemResponse])
def get_store_menu(request: Request, db: Session = Depends(get_db)):
    """
    Returns the menu items for the current tenant.
    REQUIRES schema switching.
    """
    # 1. Identify Tenant
    tenant = get_tenant_by_host(request, db)

    # 2. Switch Schema (The "Context Switch")
    # We include 'public' in the path so we can still access shared types if needed
    db.execute(text(f"SET search_path TO {tenant.schema_name}, public"))

    # 3. Query Data (SQLAlchemy now queries tenant_x.menu_items)
    items = db.query(MenuItem).filter(MenuItem.is_available == True).all()

    return items
