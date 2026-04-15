"""
Sliding-window rate limiter using Redis.

Applied as a FastAPI dependency on auth endpoints to prevent brute-force attacks.
Default: 5 requests per 60 seconds per IP address.
"""
from fastapi import Request, HTTPException, status
from app.core.redis import get_redis


RATE_LIMIT_PREFIX = "ratelimit:"


async def check_rate_limit(
    request: Request,
    limit: int = 5,
    window: int = 60,
):
    """
    Sliding-window rate limiter.
    
    Args:
        request: FastAPI request (extracts client IP)
        limit: Max requests allowed in the window
        window: Window size in seconds
    
    Raises:
        HTTPException 429 when limit exceeded
    """
    redis = await get_redis()

    # Use the client IP as the rate limit key
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    key = f"{RATE_LIMIT_PREFIX}{path}:{client_ip}"

    # Increment the counter
    current = await redis.incr(key)

    # Set expiry on first request in the window
    if current == 1:
        await redis.expire(key, window)

    if current > limit:
        # Get remaining TTL for the Retry-After header
        ttl = await redis.ttl(key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {ttl} seconds.",
            headers={"Retry-After": str(ttl)},
        )


async def rate_limit_auth(request: Request):
    """Pre-built dependency for auth routes: 5 req / 60s per IP."""
    await check_rate_limit(request, limit=5, window=60)


async def rate_limit_api(request: Request):
    """General API rate limit: 100 req / 60s per IP."""
    await check_rate_limit(request, limit=100, window=60)
