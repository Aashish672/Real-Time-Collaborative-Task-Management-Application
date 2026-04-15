"""
Authentication dependency for FastAPI.

Production-ready: checks JWT validity AND Redis blacklist on every request.
Supports graceful degradation if Redis is unavailable (logs warning, allows request).
"""
from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
import uuid

from app.database import get_db
from app import models, schemas
from app.crud.security import SECRET_KEY, ALGORITHM


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        jti = payload.get("jti")
        token_type = payload.get("token_type", "access")

        if user_id_str is None:
            raise credentials_exception

        # Only access tokens are valid for API requests
        if token_type != "access":
            raise credentials_exception

        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    # Check Redis blacklist (graceful degradation if Redis is down)
    if jti:
        try:
            from app.services.token_blacklist import is_blacklisted
            if await is_blacklisted(jti):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except RuntimeError:
            # Redis not connected — allow request but log warning
            import logging
            logging.getLogger(__name__).warning("Redis unavailable — skipping blacklist check")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user