#!/bin/bash
echo "🚀 Starting debug app..."
echo "PORT: ${PORT:-8000}"

# Direct start without complex checks
exec python -m uvicorn main_debug:app --host 0.0.0.0 --port ${PORT:-8000}