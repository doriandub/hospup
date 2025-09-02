#!/bin/bash
# Simple startup script for Railway
exec gunicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --worker-class uvicorn.workers.UvicornWorker --timeout 300