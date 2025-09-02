#!/bin/bash
echo "🚀 Starting Hospup Backend (Full Version)..."
echo "PORT: ${PORT:-8000}"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "REDIS_URL: ${REDIS_URL:0:15}..."

# Start full application
exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}