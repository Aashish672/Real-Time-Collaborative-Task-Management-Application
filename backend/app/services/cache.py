"""
Generic caching service backed by Redis.

Usage:
    cached = await get_cached("ws_stats:abc-123")
    if cached:
        return cached
    
    result = compute_expensive_thing()
    await set_cached("ws_stats:abc-123", result, ttl=60)
    return result
"""
import json
import time
import logging
from functools import wraps
from typing import Any, Optional
from app.core.redis import get_redis

logger = logging.getLogger(__name__)

def time_it(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        result = await func(*args, **kwargs)
        duration = time.perf_counter() - start_time
        # Log if operation takes longer than 10ms (adjustable)
        if duration > 0.01:
             logger.warning(f"🐢 Slow Redis operation: {func.__name__} took {duration:.4f}s")
        else:
             logger.debug(f"⚡ Redis operation: {func.__name__} took {duration:.4f}s")
        return result
    return wrapper


CACHE_PREFIX = "cache:"


@time_it
async def get_cached(key: str) -> Optional[Any]:
    """Retrieve a cached value. Returns None on miss."""
    redis = await get_redis()
    raw = await redis.get(f"{CACHE_PREFIX}{key}")
    if raw is None:
        return None
    return json.loads(raw)


@time_it
async def set_cached(key: str, value: Any, ttl: int = 300):
    """Store a value in cache with a TTL in seconds (default 5 min)."""
    redis = await get_redis()
    await redis.setex(f"{CACHE_PREFIX}{key}", ttl, json.dumps(value, default=str))


@time_it
async def invalidate(key: str):
    """Delete a specific cache key."""
    redis = await get_redis()
    await redis.delete(f"{CACHE_PREFIX}{key}")


@time_it
async def invalidate_pattern(pattern: str):
    """Delete all keys matching a glob pattern. Use sparingly."""
    redis = await get_redis()
    cursor = 0
    while True:
        cursor, keys = await redis.scan(cursor, match=f"{CACHE_PREFIX}{pattern}", count=100)
        if keys:
            await redis.delete(*keys)
        if cursor == 0:
            break
