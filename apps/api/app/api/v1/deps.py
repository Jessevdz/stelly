from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from jose import jwt, JWTError
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
    1. Try verifying JWT with Local Secret (Magic Token for Demo).
    2. If invalid, verify JWT Signature against IdP Public Keys (Standard SSO).
    3. Extract Host Header & Resolve Tenant OR Dynamic Demo Schema.
    4. Set Database Search Path for the Request.
    """

    payload = None
    auth_method = "oidc"

    # --- 1. Validation Strategy ---

    # Strategy A: Check if it is a Magic Token (Signed with local SECRET_KEY)
    try:
        # Simple decode check first
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") == "magic":
            auth_method = "magic"
    except JWTError:
        # Not a magic token, fall through to OIDC
        pass

    # Strategy B: OIDC JWKS Validation
    if not payload:
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

    # Initialize Tenant/Schema vars
    tenant = None
    target_schema = "public"

    # Check for specific schema claim (Dynamic Demo Logic)
    # The login endpoint will embed 'target_schema' into the token
    forced_schema = payload.get("target_schema")

    # A. Check for DEMO Override
    if host == settings.DEMO_DOMAIN:
        if forced_schema:
            # The user has a personal sandbox assigned via their token
            target_schema = forced_schema
        else:
            # Fallback to the generic read-only demo if no token claim exists
            # (Though effectively they shouldn't get here without a token)
            target_schema = settings.DEMO_SCHEMA

    else:
        # B. Standard Lookup
        db.execute(text("SET search_path TO public"))
        tenant = db.query(Tenant).filter(Tenant.domain == host).first()
        if tenant:
            target_schema = tenant.schema_name

    # --- 3. Authorization & Context Switch ---

    # Case A: Super Admin Console
    if host == "admin.stelly.localhost":
        # Ensure the user has super admin privileges
        is_demo_admin = auth_method == "magic" and payload.get("sub") == "demo_admin"

        email = payload.get("email")
        if not is_demo_admin and email not in settings.SUPER_ADMINS:
            raise HTTPException(
                status_code=403, detail="Not authorized for Platform Admin"
            )

        # Admin console operates in public schema
        db.execute(text("SET search_path TO public"))
        current_schema = "public"

    # Case B: Tenant / Demo Context
    elif (
        tenant
        or target_schema.startswith("demo_")
        or target_schema == settings.DEMO_SCHEMA
    ):
        # Apply the schema switch
        # We append 'public' so they can still see shared tables if necessary
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
        "is_superuser": host == "admin.stelly.localhost",
        "auth_method": auth_method,
    }
