"""
JWT Token Blacklisting via Redis.

When a user logs out, we store their token's `jti` (JWT ID) in Redis
with a TTL equal to the token's remaining lifetime. Any subsequent
request with that token will be rejected.
"""
from app.core.redis import get_redis


BLACKLIST_PREFIX = "blacklist:"


async def blacklist_token(jti: str, ttl_seconds: int):
    """Add a token's JTI to the blacklist with automatic expiry."""
    redis = await get_redis()
    await redis.setex(f"{BLACKLIST_PREFIX}{jti}", ttl_seconds, "1")


async def is_blacklisted(jti: str) -> bool:
    """Check if a token has been revoked."""
    redis = await get_redis()
    return await redis.exists(f"{BLACKLIST_PREFIX}{jti}") > 0
