from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from core.config import settings

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Hospup-SaaS API",
    description="API for Hospup SaaS platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "redis_connected": False
    }

# Simple startup check
@app.get("/")
async def root():
    return {"message": "Hospup-SaaS Backend is running (minimal mode)", "status": "ok"}

# Test endpoint
@app.get("/test")
async def test():
    return {"test": "success", "environment": settings.ENVIRONMENT, "mode": "minimal"}

# Debug endpoint for deployment
@app.get("/debug")
async def debug():
    return {
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database_url": settings.DATABASE_URL[:30] + "..." if settings.DATABASE_URL else "None",
        "redis_connected": False,
        "status": "running (minimal mode)"
    }

# Test API v1 auth endpoint
@app.get("/api/v1/auth/test")
async def test_auth():
    return {"test": "auth endpoint working", "status": "minimal"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        proxy_headers=True,
        forwarded_allow_ips="*"
    )