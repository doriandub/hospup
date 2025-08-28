from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
import time
import logging
from contextlib import asynccontextmanager
import redis.asyncio as redis
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from core.security import verify_jwt_token
from core.rate_limiter import RateLimiter
from api.v1 import auth, properties, videos, upload, dashboard, video_generation, websocket, video_analysis, viral_matching, video_reconstruction, health, text_customization, text_suggestions, instagram_proxy, ai_templates, preview
from api import instagram_templates
from routers import video_recovery
from models.user import User

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Redis connection for rate limiting
redis_client = None
rate_limiter = None

security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global redis_client, rate_limiter
    logger.info("Starting Hospup-SaaS Backend")
    redis_client = redis.from_url(settings.REDIS_URL)
    rate_limiter = RateLimiter(redis_client)
    yield
    # Shutdown
    logger.info("Shutting down Hospup-SaaS Backend")
    if redis_client:
        await redis_client.close()

app = FastAPI(
    title="Hospup-SaaS API",
    description="API for Hospup SaaS platform",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=settings.allowed_hosts_list
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    
    # Debug upload requests
    if "upload/presigned-url" in str(request.url):
        body = await request.body()
        print(f"DEBUG - Upload request URL: {request.url}")
        print(f"DEBUG - Headers: {dict(request.headers)}")
        print(f"DEBUG - Body: {body}")
        print(f"DEBUG - Method: {request.method}")
        # Reset the request body for downstream consumption
        request._body = body
    
    # Rate limiting (temporarily disabled for debugging)
    # is_allowed = await rate_limiter.is_allowed(
    #     key=f"rate_limit:{client_ip}",
    #     max_requests=settings.RATE_LIMIT_REQUESTS,
    #     window_seconds=settings.RATE_LIMIT_WINDOW
    # )
    # 
    # if not is_allowed:
    #     return JSONResponse(
    #         status_code=429,
    #         content={"detail": "Rate limit exceeded"}
    #     )
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

# Validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    print(f"DEBUG - Validation error on {request.url}")
    print(f"DEBUG - Request body: {body}")
    print(f"DEBUG - Validation errors: {exc.errors()}")
    print(f"DEBUG - Content-Type: {request.headers.get('content-type')}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": body.decode() if body else None,
            "message": "Validation error",
            "url": str(request.url)
        }
    )

# Import get_current_user from centralized auth
from core.auth import get_current_user

# API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

app.include_router(
    properties.router, 
    prefix="/api/v1/properties", 
    tags=["properties"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    videos.router, 
    prefix="/api/v1/videos", 
    tags=["videos"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    upload.router, 
    prefix="/api/v1/upload", 
    tags=["upload"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    dashboard.router, 
    prefix="/api/v1/dashboard", 
    tags=["dashboard"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    video_generation.router, 
    prefix="/api/v1", 
    tags=["video-generation"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    video_analysis.router, 
    prefix="/api/v1/video-analysis", 
    tags=["video-analysis"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    viral_matching.router, 
    prefix="/api/v1/viral-matching", 
    tags=["viral-matching"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    video_reconstruction.router, 
    prefix="/api/v1/video-reconstruction", 
    tags=["video-reconstruction"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    instagram_templates.router,
    tags=["instagram-templates"],
)
app.include_router(
    instagram_proxy.router,
    prefix="/api/v1/instagram",
    tags=["instagram-proxy"]
)
app.include_router(websocket.router)

# Text customization endpoints  
app.include_router(
    text_customization.router,
    prefix="/api/v1/text",
    tags=["text-customization"]
)

# Text suggestions endpoints
app.include_router(
    text_suggestions.router,
    prefix="/api/v1/text",
    tags=["text-suggestions"],
    dependencies=[Depends(get_current_user)]
)
app.include_router(
    ai_templates.router, 
    prefix="/api/v1/ai-templates", 
    tags=["ai-templates"],
    dependencies=[Depends(get_current_user)]
)
# Preview endpoints for FFmpeg text overlay generation  
app.include_router(
    preview.router,
    tags=["preview"],
    dependencies=[Depends(get_current_user)]
)

# Health check endpoints (no auth required)
app.include_router(
    health.router,
    prefix="/api/v1",
    tags=["health"]
)

# Video recovery endpoints
app.include_router(video_recovery.router)

# Mount static files for local development
import os
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=uploads_dir), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development"
    )