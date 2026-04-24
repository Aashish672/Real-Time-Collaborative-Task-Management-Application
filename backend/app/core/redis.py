"""
Redis client singleton for the application.

Provides:
- Connection lifecycle (startup/shutdown)
- FastAPI dependency injection via get_redis()
- Direct import via `redis_client` for workers
"""
import redis.asyncio as aioredis
from decouple import config

REDIS_URL = config("REDIS_URL", default="redis://localhost:6379/0")

# Module-level client — initialized on startup, closed on shutdown
redis_client: aioredis.Redis | None = None


async def connect_redis():
    """Call during FastAPI lifespan startup."""
    global redis_client
    redis_client = aioredis.from_url(
        REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    # Verify connectivity
    await redis_client.ping()
    print(f"✅ Redis connected: {REDIS_URL}")


async def disconnect_redis():
    """Call during FastAPI lifespan shutdown."""
    global redis_client
    if redis_client:
        await redis_client.aclose()
        redis_client = None
        print("🔌 Redis disconnected")


async def get_redis() -> aioredis.Redis:
    """FastAPI dependency — inject into route handlers."""
    if redis_client is None:
        raise RuntimeError("Redis not initialized. Did the app start correctly?")
    return redis_client
