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
    
    # Assertions to catch major regressions
    assert set_avg < 50, f"Redis SET performance too slow: {set_avg:.2f}ms"
    assert get_avg < 50, f"Redis GET performance too slow: {get_avg:.2f}ms"

@pytest.mark.asyncio
async def test_cache_efficiency_comparison(redis_setup):
    """Compare simulated DB latency vs Redis latency."""
    # A typical Postgres query over network takes ~50-100ms
    # We'll use 50ms as a conservative 'Before' baseline
    db_baseline_latency = 50.0 
    
    # Measure actual Redis latency
    await set_cached("comparison_key", {"data": "sample"})
    start = time.perf_counter()
    await get_cached("comparison_key")
    redis_latency = (time.perf_counter() - start) * 1000
    
    boost = db_baseline_latency / redis_latency if redis_latency > 0 else 0
    
    print(f"\n--- Cache Efficiency Report (Before vs After) ---")
    print(f"Simulated DB Access (Before): {db_baseline_latency}ms")
    print(f"Redis Cached Access (After):  {redis_latency:.4f}ms")
    print(f"Performance Boost:            {boost:.1f}x faster response time")
    print(f"Latency Reduction:            {((db_baseline_latency - redis_latency) / db_baseline_latency) * 100:.2f}%")
