import uuid
import re
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.db.models import Tenant
from app.schemas.provision import TenantCreateRequest, TenantResponse
from app.api.v1.deps import get_current_user
from app.core.config import settings

router = APIRouter()


@router.post("/provision", response_model=TenantResponse)
def provision_tenant(
    payload: TenantCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Provisions a new tenant.
    Protected: Only accessible by Super Admins via the Admin Portal.
    """

    # 1. Authorization Check
    # (Double check, though deps.py usually handles the context)
    if not current_user.get("is_superuser"):
        # Just in case they hit this endpoint from a tenant domain
        if current_user.get("email") not in settings.SUPER_ADMINS:
            raise HTTPException(
                status_code=403, detail="Only Super Admins can provision tenants."
            )

    # 2. Clean & Check Domain
    clean_name = re.sub(r"[^a-zA-Z0-9]", "", payload.name.lower())
    schema_name = f"tenant_{clean_name}"

    # Ensure we are in public schema for this check
    db.execute(text("SET search_path TO public"))

    existing = db.query(Tenant).filter(Tenant.domain == payload.domain).first()
    if existing:
        raise HTTPException(status_code=400, detail="Domain already taken")

    # 3. Create Tenant Record
    new_tenant = Tenant(
        name=payload.name,
        domain=payload.domain,
        schema_name=schema_name,
        theme_config={
            "preset": "mono-luxe",
            "primary_color": payload.primary_color,
            "font_family": payload.font_family,
        },
    )
    db.add(new_tenant)
    try:
        db.commit()
        db.refresh(new_tenant)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    # 4. Create Schema (Raw SQL)
    try:
        db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
        db.commit()
    except Exception as e:
        db.delete(new_tenant)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to create schema: {e}")

    # 5. Create Tables & Seed Data
    from app.db.base import Base
    from app.db.session import engine

    tenant_tables = [
        table for table in Base.metadata.sorted_tables if table.schema != "public"
    ]

    try:
        with engine.begin() as connection:
            # Switch Context
            connection.execute(text(f"SET search_path TO {schema_name}"))

            # Create Structure
            Base.metadata.create_all(bind=connection, tables=tenant_tables)

            # --- A. Create Default Admin ---
            # NOTE: With OIDC, we don't strictly need a local users table for auth,
            # but we might keep it for local profile data or role mapping.
            # We skip creating a password-based user here since we use SSO.

            # --- B. Seed Data (Menu with Ranks) ---
            if payload.seed_data:
                # 1. Generate IDs for Categories
                cat_mains_id = uuid.uuid4()
                cat_sides_id = uuid.uuid4()
                cat_drinks_id = uuid.uuid4()

                # 2. Insert Categories
                connection.execute(
                    text(
                        "INSERT INTO categories (id, name, rank) VALUES (:id, :name, :rank)"
                    ),
                    [
                        {"id": cat_mains_id, "name": "Signatures", "rank": 0},
                        {"id": cat_sides_id, "name": "Sides", "rank": 1},
                        {"id": cat_drinks_id, "name": "Drinks", "rank": 2},
                    ],
                )

                # 3. Insert Menu Items
                connection.execute(
                    text(
                        """
                        INSERT INTO menu_items (id, name, description, price, image_url, is_available, category_id, rank)
                        VALUES (:id, :name, :desc, :price, :img, :avail, :cat_id, :rank)
                        """
                    ),
                    [
                        {
                            "id": uuid.uuid4(),
                            "name": "The OmniBurger",
                            "desc": "Double patty, brioche bun, secret sauce.",
                            "price": 1400,
                            "img": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60",
                            "avail": True,
                            "cat_id": cat_mains_id,
                            "rank": 0,
                        },
                        {
                            "id": uuid.uuid4(),
                            "name": "Truffle Fries",
                            "desc": "Crispy fries topped with parmesan and truffle oil.",
                            "price": 600,
                            "img": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=500&q=60",
                            "avail": True,
                            "cat_id": cat_sides_id,
                            "rank": 0,
                        },
                        {
                            "id": uuid.uuid4(),
                            "name": "Vanilla Shake",
                            "desc": "Classic hand-spun milkshake.",
                            "price": 500,
                            "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=60",
                            "avail": True,
                            "cat_id": cat_drinks_id,
                            "rank": 0,
                        },
                    ],
                )

    except Exception as e:
        # Rollback everything if provisioning fails
        db.delete(new_tenant)
        db.commit()
        # Drop schema if it was created
        db.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
        db.commit()
        raise HTTPException(
            status_code=500, detail=f"Table creation/seeding failed: {e}"
        )

    return TenantResponse(
        id=str(new_tenant.id),
        schema_name=schema_name,
        message=f"Tenant created. Login via SSO.",
    )
