import uuid
import re
from fastapi import APIRouter, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db, engine
from app.db.models import Tenant, Lead
from app.schemas.provision import TenantCreateRequest, TenantResponse
from app.api.v1.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token
from app.core.seed_internal import provision_tenant_internal, DEMO_TENANT_SEED

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
    if not current_user.get("is_superuser"):
        if current_user.get("email") not in settings.SUPER_ADMINS:
            raise HTTPException(
                status_code=403, detail="Only Super Admins can provision tenants."
            )

    clean_name = re.sub(r"[^a-zA-Z0-9]", "", payload.name.lower())
    schema_name = f"tenant_{clean_name}"

    db.execute(text("SET search_path TO public"))

    existing = db.query(Tenant).filter(Tenant.domain == payload.domain).first()
    if existing:
        raise HTTPException(status_code=400, detail="Domain already taken")

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

    try:
        db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
        db.commit()
    except Exception as e:
        db.delete(new_tenant)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to create schema: {e}")

    # Use the shared seeding logic
    seed_data = {
        "name": payload.name,
        "domain": payload.domain,
        "schema_name": schema_name,
        "theme_config": new_tenant.theme_config,
        "categories": DEMO_TENANT_SEED["categories"],  # Use default demo menu
    }

    try:
        provision_tenant_internal(db, seed_data, engine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {e}")

    return TenantResponse(
        id=str(new_tenant.id),
        schema_name=schema_name,
        message=f"Tenant created. Login via SSO.",
    )


# --- DYNAMIC DEMO GENERATION ---


@router.post("/generate-demo-session")
def generate_demo_session(payload: dict = Body(...), db: Session = Depends(get_db)):
    """
    Lead Generation & Sandbox Provisioning.
    1. Saves lead details (Name, Email).
    2. Creates a unique, ephemeral PostgreSQL schema.
    3. Seeds it with the Demo Bistro data.
    4. Returns a JWT locked to that schema.
    """
    name = payload.get("name")
    email = payload.get("email")

    if not name or not email:
        raise HTTPException(status_code=400, detail="Name and Email are required.")

    # 1. Generate Schema Name
    # We use a UUID hex to ensure uniqueness and difficult guessability
    session_id = uuid.uuid4().hex[:12]
    schema_name = f"demo_{session_id}"

    # 2. Save Lead (Public Schema)
    try:
        db.execute(text("SET search_path TO public"))
        lead = Lead(name=name, email=email, assigned_schema=schema_name)
        db.add(lead)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Lead Save Error: {e}")
        # Proceed anyway, don't block the demo if lead save fails (rare)

    # 3. Create Schema & Seed
    try:
        # Create Schema
        db.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
        db.commit()

        # Seed Data
        # We reuse the High Fidelity Demo Seed, but override the schema name
        session_seed = DEMO_TENANT_SEED.copy()
        session_seed["schema_name"] = schema_name

        # Run provisioning (create tables + insert data)
        # We pass a flag to skip creating the public Tenant record inside the seeder
        # because ephemeral sessions don't need a persistent public record for routing.
        provision_tenant_internal(db, session_seed, engine, skip_public_record=True)

        # Create a "fake" tenant config in the session so settings endpoints work.
        # Since our /settings endpoints read from 'public.tenants', we DO need a record there
        # for this specific ephemeral schema, otherwise settings changes won't persist or be readable.
        # We insert a dummy Tenant record into the PUBLIC table for this ephemeral schema.

        db.execute(text("SET search_path TO public"))
        ephemeral_tenant = Tenant(
            name=f"{name}'s Bistro",
            domain=f"demo-{session_id}.local",  # Fake domain, not used for routing
            schema_name=schema_name,
            theme_config=DEMO_TENANT_SEED["theme_config"],
        )
        db.add(ephemeral_tenant)
        db.commit()

    except Exception as e:
        print(f"Provisioning Error: {e}")
        # Clean up if possible
        try:
            db.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
            db.commit()
        except:
            pass
        raise HTTPException(
            status_code=500,
            detail="Failed to prepare your environment. Please try again.",
        )

    # 4. Generate Token with Custom Claim
    # This 'target_schema' claim tells deps.py to switch to this schema
    token = create_access_token(
        subject="demo_user",
        extra_claims={
            "target_schema": schema_name,
            "email": email,
            "name": name,
            "type": "magic",
        },
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"name": name, "email": email, "role": "admin", "schema": schema_name},
    }


@router.post("/reset-demo")
def reset_demo_data(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    Resets the current user's specific demo environment.
    """
    schema = current_user.get("schema")

    # Safety check: ensure we are only resetting a demo schema
    if not schema or not schema.startswith("demo_"):
        raise HTTPException(status_code=403, detail="Cannot reset this environment.")

    try:
        db.execute(text(f"SET search_path TO {schema}"))
        db.execute(text("TRUNCATE TABLE orders CASCADE"))
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear orders: {e}")

    # Reset Branding
    try:
        db.execute(text("SET search_path TO public"))
        tenant = db.query(Tenant).filter(Tenant.schema_name == schema).first()
        if tenant:
            tenant.theme_config = DEMO_TENANT_SEED["theme_config"]
            db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset theme: {e}")

    return {"message": "Environment reset successfully."}
