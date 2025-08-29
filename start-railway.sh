#!/bin/bash

# Start script for Railway deployment
echo "🚀 Starting Hospup backend on Railway..."

# Change to backend directory
cd apps/backend

# Run database migrations
echo "📦 Running database migrations..."
alembic upgrade head

# Start Celery worker in background
echo "🔄 Starting Celery worker..."
celery -A tasks.celery_app worker --loglevel=info --detach

# Start Celery beat scheduler in background
echo "⏰ Starting Celery beat scheduler..."
celery -A tasks.celery_app beat --loglevel=info --detach

# Start FastAPI application
echo "🌟 Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1