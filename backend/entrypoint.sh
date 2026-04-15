#!/bin/bash
set -e

# Helper to wait for services
wait_for_service() {
    local host=$1
    local port=$2
    local name=$3
    echo "waiting for $name ($host:$port)..."
    until python -c "import socket; s = socket.socket(); s.settimeout(2); s.connect(('$host', $port))" > /dev/null 2>&1; do
        echo "$name is unavailable - sleeping"
        sleep 1
    done
    echo "✅ $name is up!"
}

# Wait for critical services
wait_for_service "db" 5432 "PostgreSQL"
wait_for_service "redis" 6379 "Redis"
wait_for_service "rabbitmq" 5672 "RabbitMQ"

# Always run migrations on startup (safe/idempotent thanks to recent fix)
echo "🚀 Running migrations..."
alembic upgrade head

echo "🔥 Starting command: $@"
exec "$@"
