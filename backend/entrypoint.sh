#!/bin/bash
set -e

# Helper to wait for services
wait_for_service() {
    local host=$1
    local port=$2
    local name=$3
    echo "🔍 Testing connectivity to $name ($host:$port)..."
    until python -c "
import socket
import sys
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    s.connect(('$host', $port))
    s.close()
    sys.exit(0)
except Exception as e:
    print(f'❌ Connection to $name failed: {e}')
    sys.exit(1)
" ; do
        echo "⏳ $name is unavailable - retrying in 2s..."
        sleep 2
    done
    echo "✅ $name is up!"
}

# Wait for critical services
echo "🌐 Diagnostic: Checking DNS resolution..."
python -c "import socket; hosts=['db', 'cache', 'rabbitmq']; [print(f'{h}: {socket.gethostbyname(h)}') for h in hosts if socket.gethostbyname(h)]" || echo "⚠️ Some hosts could not be resolved yet."

wait_for_service "db" 5432 "PostgreSQL"
wait_for_service "cache" 6379 "Redis"
wait_for_service "rabbitmq" 5672 "RabbitMQ"

# Always run migrations on startup (safe/idempotent thanks to recent fix)
echo "🚀 Running migrations..."
alembic upgrade head

echo "🔥 Starting command: $@"
exec "$@"
