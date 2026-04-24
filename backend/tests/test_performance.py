import asyncio
import time
import pytest
from app.services.cache import set_cached, get_cached, invalidate
from app.core.redis import connect_redis, disconnect_redis

@pytest.fixture(scope="module")
async def redis_setup():
    await connect_redis()
    yield
    await disconnect_redis()

@pytest.mark.asyncio
async def test_redis_performance(redis_setup):
    """Benchmark Redis GET/SET operations."""
    iterations = 1000
    key = "perf_test_key"
    value = {"data": "test" * 100}  # ~400 bytes

    # Measure SET performance
    start_set = time.perf_counter()
    for i in range(iterations):
        await set_cached(f"{key}:{i}", value, ttl=60)
    end_set = time.perf_counter()
    
    set_duration = end_set - start_set
    set_avg = (set_duration / iterations) * 1000 # ms

    # Measure GET performance
    start_get = time.perf_counter()
    for i in range(iterations):
        await get_cached(f"{key}:{i}")
    end_get = time.perf_counter()

    get_duration = end_get - start_get
    get_avg = (get_duration / iterations) * 1000 # ms

    # Cleanup
    for i in range(iterations):
        await invalidate(f"{key}:{i}")

    print(f"\n--- Redis Performance Results ({iterations} iterations) ---")
    print(f"Total SET time: {set_duration:.4f}s (Avg: {set_avg:.4f}ms/op)")
    print(f"Total GET time: {get_duration:.4f}s (Avg: {get_avg:.4f}ms/op)")
    
    # Assertions to catch major regressions (e.g., > 50ms per op is usually bad for local/CI)
    assert set_avg < 50, f"Redis SET performance too slow: {set_avg:.2f}ms"
    assert get_avg < 50, f"Redis GET performance too slow: {get_avg:.2f}ms"
