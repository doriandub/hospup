#!/bin/bash
set -e

echo "🚀 Starting Hospup Backend on Railway..."
echo "PORT: ${PORT:-8000}"
echo "Environment: ${ENVIRONMENT:-production}"

# Test if we can import the app
echo "🔍 Testing Python imports..."
python -c "
try:
    print('✅ Testing basic imports...')
    import fastapi
    print('✅ FastAPI imported successfully')
    
    print('🔍 Testing app import...')
    from main import app
    print('✅ Main app imported successfully')
    
    print('🎯 All imports successful - starting server')
except Exception as e:
    print(f'❌ Import error: {e}')
    import traceback
    traceback.print_exc()
    exit(1)
"

echo "🔧 Starting with debug application to test deployment..."
exec gunicorn main_debug:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --workers 1 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 300 \
    --log-level info