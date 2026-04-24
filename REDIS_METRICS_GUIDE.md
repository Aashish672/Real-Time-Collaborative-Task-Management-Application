# Redis Metrics and Monitoring Guide

This guide explains how to monitor key performance indicators (KPIs) for the Redis instance in this project.

## 1. Key Metrics to Track

| Metric | Importance | How to measure (CLI) |
| :--- | :--- | :--- |
| **Latency** | Speed of individual commands. | `redis-cli --latency` |
| **Throughput** | Ops per second the server handles. | `redis-cli info stats \| grep instantaneous_ops_per_sec` |
| **Memory Usage** | Amount of RAM consumed. | `redis-cli info memory \| grep used_memory_human` |
| **Hit/Miss Ratio** | Efficiency of your cache. | `redis-cli info stats \| grep keyspace` |
| **Evictions** | Keys removed due to memory pressure. | `redis-cli info stats \| grep evicted_keys` |
| **Active Connections** | Number of connected clients. | `redis-cli info clients \| grep connected_clients` |

## 2. Calculating Cache Hit Ratio
The Hit Ratio is calculated as:
`hits / (hits + misses)`

To see current counts:
```bash
redis-cli info stats | grep -E 'keyspace_hits|keyspace_misses'
```

## 3. Finding Slow Queries
Redis logs queries that exceed a certain execution time (default 10ms).
```bash
# Get the last 10 slow queries
redis-cli slowlog get 10

# Reset the slow log
redis-cli slowlog reset
```

## 4. Monitoring in Real-time
To watch commands as they hit the server (useful for debugging but impacts performance):
```bash
redis-cli monitor
```

## 5. Memory Optimization
If `evicted_keys` is high, consider:
- Increasing `maxmemory` in `redis.conf`.
- Changing `maxmemory-policy` to `allkeys-lru`.
- Reducing the TTL of cached items in `backend/app/services/cache.py`.
