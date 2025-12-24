from datetime import datetime, timedelta, timezone
from typing import Any, Union, Dict
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, Any],
    expires_delta: timedelta = None,
    extra_claims: Dict[str, Any] = {},
) -> str:
    """
    Creates a locally signed JWT (HS256) for Magic Login / Demo Mode.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject), "type": "magic"}
    to_encode.update(extra_claims)  # Add custom claims (like target_schema)

    # Use the local SECRET_KEY and HS256 for internal tokens
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt
