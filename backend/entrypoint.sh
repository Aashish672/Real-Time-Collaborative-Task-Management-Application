#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Running database migrations..."
alembic upgrade head

echo "🔥 Starting Gunicorn server..."
# Using gunicorn with uvicorn workers for production
# -w 4: Number of worker processes (usually 2 x cores + 1)
# -k uvicorn.workers.UvicornWorker: The worker class for FastAPI
# --bind 0.0.0.0:8000: Listen on all interfaces
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000 --timeout 120 --keep-alive 5
