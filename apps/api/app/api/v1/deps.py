from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from jose import jwt
from typing import Dict, Any
import httpx
from app.db.session import get_db
from app.core.config import settings
from app.db.models import Tenant

# The frontend handles the redirect flow, so this URL is mostly for Swagger UI documentation
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="http://auth.localhost/application/o/token/"
)


async def get_jwks() -> Dict[str, Any]:
    """
    Fetch JSON Web Key Set from the Identity Provider.
    In a production app, you should cache this result to avoid HTTP calls on every request.
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.JWKS_URL)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"JWKS Fetch Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not verify identity provider availability.",
        )


async def get_current_user(
    request: Request, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    1. Verify JWT Signature against IdP Public Keys.
    2. Extract Host Header.
    3. Resolve Tenant from DB (Public Schema).
    4. Set Database Search Path for the Request.
    """

    # --- 1. Validation ---
    jwks = await get_jwks()

    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=[settings.ALGORITHM],
            audience=settings.OIDC_AUDIENCE,
            options={"verify_at_hash": False},
        )
    except Exception as e:
        print(f"Token Validation Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authentication Token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # --- 2. Tenant Context Resolution ---
    host = request.headers.get("host", "").split(":")[0]

    # We query the public schema for the tenant config
    # We explicitly set search_path to public first to ensure we can read the tenants table
    db.execute(text("SET search_path TO public"))
    tenant = db.query(Tenant).filter(Tenant.domain == host).first()

    # --- 3. Authorization & Context Switch ---

    # Case A: Super Admin Console
    if host == "admin.omniorder.localhost":
        # Ensure the user has super admin privileges (via email check for MVP)
        email = payload.get("email")
        if email not in settings.SUPER_ADMINS:
            raise HTTPException(
                status_code=403, detail="Not authorized for Platform Admin"
            )

        # Admin console operates in public schema
        db.execute(text("SET search_path TO public"))
        current_schema = "public"

    # Case B: Tenant Context (e.g. pizza.localhost)
    elif tenant:
        # For MVP: We blindly allow any valid user to access the tenant if they have a token.
        # In Prod: We would check `payload.get("groups")` to see if they belong to `tenant_pizzahut_admins`

        target_schema = tenant.schema_name
        db.execute(text(f"SET search_path TO {target_schema}, public"))
        current_schema = target_schema

    else:
        # Host is unknown and not admin
        raise HTTPException(
            status_code=404, detail=f"Tenant not found for host: {host}"
        )

    # Return a simplified User Object derived from the Token
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "name": payload.get("name"),
        "schema": current_schema,
        "is_superuser": host == "admin.omniorder.localhost",
    }
