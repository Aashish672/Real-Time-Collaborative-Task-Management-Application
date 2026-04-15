"""
JWT Token creation and verification utilities.

Production-ready: tokens include `jti` (JWT ID) for blacklisting,
`token_type` for distinguishing access vs refresh, and configurable expiry.
"""
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import os
import uuid

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key")
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    to_encode.update({
        "exp": expire,
        "jti": str(uuid.uuid4()),
        "token_type": "access",
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

    to_encode.update({
        "exp": expire,
        "jti": str(uuid.uuid4()),
        "token_type": "refresh",
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode a JWT token and return the payload. Raises JWTError on failure."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def get_token_remaining_ttl(payload: dict) -> int:
    """Calculate seconds remaining before token expiry. Returns 0 if already expired."""
    exp = payload.get("exp")
    if exp is None:
        return 0
    remaining = exp - int(datetime.now(timezone.utc).timestamp())
    return max(remaining, 0)