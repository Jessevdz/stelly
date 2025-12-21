import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.db.models import Tenant, User, Category, MenuItem
from app.schemas.provision import TenantCreateRequest, TenantResponse
from app.core.security import get_password_hash
import re

router = APIRouter()


@router.post("/provision", response_model=TenantResponse)
def provision_tenant(payload: TenantCreateRequest, db: Session = Depends(get_db)):
    # 1. Clean & Check Domain
    clean_name = re.sub(r"[^a-zA-Z0-9]", "", payload.name.lower())
    schema_name = f"tenant_{clean_name}"

    existing = db.query(Tenant).filter(Tenant.domain == payload.domain).first()
    if existing:
        raise HTTPException(status_code=400, detail="Domain already taken")

    # 2. Create Tenant Record (with Font in theme_config)
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

    # 3. Create Schema (Raw SQL)
    try:
        db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
        db.commit()
    except Exception as e:
        db.delete(new_tenant)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to create schema: {e}")

    # 4. Create Tables & Seed Data
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
            admin_email = f"admin@{payload.domain}"
            hashed_pwd = get_password_hash("password")

            connection.execute(
                text(
                    """
                    INSERT INTO users (id, email, hashed_password, full_name, role)
                    VALUES (:id, :email, :pwd, :name, 'admin')
                    """
                ),
                {
                    "id": uuid.uuid4(),
                    "email": admin_email,
                    "pwd": hashed_pwd,
                    "name": "Super Admin",
                },
            )

            # --- B. Seed Data (Phase 4 Logic) ---
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
                        INSERT INTO menu_items (id, name, description, price, image_url, is_available, category_id)
                        VALUES (:id, :name, :desc, :price, :img, :avail, :cat_id)
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
                        },
                        {
                            "id": uuid.uuid4(),
                            "name": "Truffle Fries",
                            "desc": "Crispy fries topped with parmesan and truffle oil.",
                            "price": 600,
                            "img": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=500&q=60",
                            "avail": True,
                            "cat_id": cat_sides_id,
                        },
                        {
                            "id": uuid.uuid4(),
                            "name": "Vanilla Shake",
                            "desc": "Classic hand-spun milkshake.",
                            "price": 500,
                            "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=500&q=60",
                            "avail": True,
                            "cat_id": cat_drinks_id,
                        },
                    ],
                )

    except Exception as e:
        # Rollback everything if provisioning fails
        db.delete(new_tenant)
        db.commit()
        db.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
        db.commit()
        raise HTTPException(
            status_code=500, detail=f"Table creation/seeding failed: {e}"
        )

    return TenantResponse(
        id=str(new_tenant.id),
        schema_name=schema_name,
        message=f"Tenant created. Admin: {admin_email} / 'password'",
    )
