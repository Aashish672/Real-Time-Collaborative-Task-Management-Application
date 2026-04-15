"""
Authentication routes — production-ready.

Endpoints:
  POST /auth/register       — Create account + queue verification email
  POST /auth/login          — Login with email/password
  POST /auth/oauth          — Google OAuth login
  POST /auth/logout         — Blacklist current token
  POST /auth/refresh        — Rotate access + refresh tokens
  GET  /auth/verify-email   — Verify email via token
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import uuid

from app import schemas, models, crud
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.crud.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_remaining_ttl,
    SECRET_KEY,
    ALGORITHM,
)
from app.middleware.rate_limiter import rate_limit_auth
from jose import JWTError

auth_routes = APIRouter(prefix="/auth", tags=["Authentication"])


# ─── REGISTER ─────────────────────────────────────────────

@auth_routes.post(
    "/register",
    response_model=schemas.UserPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_auth)],
)
async def register(body: schemas.UserRegistration, db: Session = Depends(get_db)):
    user = crud.register(db=db, body=body)

    # Queue verification email (non-blocking)
    try:
        from app.services.email_service import publish_verification_email
        from app.core.rabbitmq import get_channel
        channel = await get_channel()
        verification_token = create_access_token(
            {"sub": str(user.id), "purpose": "verify_email"},
        )
        await publish_verification_email(
            channel=channel,
            email=user.email,
            user_name=user.full_name,
            verification_token=verification_token,
        )
    except Exception as e:
        # Don't block registration if email queue is down
        import logging
        logging.getLogger(__name__).warning(f"Failed to queue verification email: {e}")

    return user


# ─── LOGIN ────────────────────────────────────────────────

@auth_routes.post(
    "/login",
    response_model=schemas.TokenResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_auth)],
)
def login(body: schemas.UserLogin, db: Session = Depends(get_db)):
    return crud.login_user(db=db, body=body)


# ─── GOOGLE OAUTH ─────────────────────────────────────────

@auth_routes.post("/oauth", response_model=schemas.TokenResponse, status_code=status.HTTP_200_OK)
def oauth_register(body: schemas.UserOAuth, db: Session = Depends(get_db)):
    user = crud.oauth_register(db=db, body=body)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# ─── LOGOUT ───────────────────────────────────────────────

@auth_routes.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    current_user: models.User = Depends(get_current_user),
):
    """Blacklist the current access token in Redis."""
    from fastapi.security import OAuth2PasswordBearer

    # Extract the raw token from the Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Bearer token")

    token = auth_header.split(" ", 1)[1]

    try:
        payload = decode_token(token)
        jti = payload.get("jti")
        if jti:
            ttl = get_token_remaining_ttl(payload)
            from app.services.token_blacklist import blacklist_token
            await blacklist_token(jti, ttl if ttl > 0 else 1)
    except JWTError:
        pass  # Token already invalid — that's fine

    return None


# ─── TOKEN REFRESH ────────────────────────────────────────

@auth_routes.post("/refresh", response_model=schemas.TokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(body: schemas.RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Rotate tokens: validate refresh token → issue new pair → blacklist old refresh.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )

    try:
        payload = decode_token(body.refresh_token)
        user_id_str = payload.get("sub")
        jti = payload.get("jti")
        token_type = payload.get("token_type")

        if user_id_str is None or token_type != "refresh":
            raise credentials_exception

        # Check if this refresh token has been blacklisted (replay attack prevention)
        if jti:
            from app.services.token_blacklist import is_blacklisted, blacklist_token
            if await is_blacklisted(jti):
                raise credentials_exception
            # Blacklist the old refresh token immediately (rotation)
            ttl = get_token_remaining_ttl(payload)
            await blacklist_token(jti, ttl if ttl > 0 else 1)

    except JWTError:
        raise credentials_exception

    # Verify user still exists
    user_id = uuid.UUID(user_id_str)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise credentials_exception

    # Issue new token pair
    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


# ─── EMAIL VERIFICATION ──────────────────────────────────

@auth_routes.get("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify a user's email address using the token from the verification email."""
    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        purpose = payload.get("purpose")

        if user_id_str is None or purpose != "verify_email":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")

        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_verified:
        return {"message": "Email already verified"}

    user.is_verified = True
    db.commit()

    return {"message": "Email verified successfully"}
