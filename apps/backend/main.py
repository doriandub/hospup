from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
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
    
    # Initialize Redis (non-blocking)
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        rate_limiter = RateLimiter(redis_client)
        logger.info("Redis connection initialized")
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Continuing without Redis.")
        redis_client = None
        rate_limiter = None
    
    # Test database connection and create tables (non-blocking)
    try:
        from core.database import engine, create_tables
        from sqlalchemy import text
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Database connection test successful")
        
        # Create tables if they don't exist
        try:
            create_tables()
            logger.info("Database tables verified/created")
        except Exception as table_error:
            logger.error(f"Error creating tables: {table_error}")
            # Force create tables even if there's an error
            try:
                from models.user import User
                from core.database import Base
                Base.metadata.create_all(bind=engine)
                logger.info("Database tables force-created successfully")
            except Exception as force_error:
                logger.error(f"Force table creation also failed: {force_error}")
    except Exception as e:
        logger.warning(f"Database connection test failed: {e}. Application will continue but database operations may fail.")
    
    logger.info("Backend startup complete")
    yield
    
    # Shutdown
    logger.info("Shutting down Hospup-SaaS Backend")
    if redis_client:
        try:
            await redis_client.close()
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")

app = FastAPI(
    title="Hospup-SaaS API",
    description="API for Hospup SaaS platform",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# Security middleware - temporarily disabled for debugging
# app.add_middleware(
#     TrustedHostMiddleware, 
#     allowed_hosts=settings.allowed_hosts_list
# )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def process_time_middleware(request: Request, call_next):
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
        "environment": settings.ENVIRONMENT,
        "redis_connected": redis_client is not None
    }

# Simple startup check
@app.get("/")
async def root():
    return {"message": "Hospup-SaaS Backend is running", "status": "ok"}

# Database test endpoint
@app.get("/db-test")
async def db_test(db: Session = Depends(get_db)):
    try:
        from models.user import User
        # Test database connection by counting users
        user_count = db.query(User).count()
        # Try to find the specific user
        test_user = db.query(User).filter(User.email == "userproduction@example.com").first()
        user_exists = test_user is not None
        user_details = None
        if test_user:
            user_details = {
                "id": test_user.id,
                "email": test_user.email,
                "name": test_user.name,
                "is_active": test_user.is_active,
                "created_at": str(test_user.created_at)
            }
        
        return {
            "database_connection": "success",
            "total_users": user_count,
            "test_user_exists": user_exists,
            "user_details": user_details
        }
    except Exception as e:
        return {
            "database_connection": "failed",
            "error": str(e),
            "error_type": type(e).__name__
        }

# Test endpoint (simplified for stability)
@app.get("/test")
async def test():
    try:
        return {"test": "success", "environment": settings.ENVIRONMENT, "version": "2025-09-01-v4", "timestamp": time.time()}
    except Exception as e:
        logger.error(f"Error in test endpoint: {e}")
        return {"test": "error", "message": str(e), "version": "2025-09-01-v4"}

# Create tables endpoint
@app.post("/create-tables")
async def create_database_tables():
    try:
        from core.database import engine, Base
        from models.user import User
        
        # Force create all tables
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        with engine.connect() as conn:
            from sqlalchemy import text
            result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
            tables = [row[0] for row in result]
        
        return {"success": True, "message": "Database tables created successfully", "tables": tables}
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        return {"success": False, "error": str(e)}

# Dependencies test endpoint - temporarily disabled to fix 502
# @app.get("/deps")  
# async def test_deps():
#     return {"status": "deps endpoint temporarily disabled to fix 502 error"}

# Debug endpoint for deployment (simplified to prevent 502 errors)
@app.get("/debug")
async def debug():
    try:
        from core.deployment import deployment_config
        config = deployment_config.get_processing_config()
    except Exception as e:
        logger.error(f"Could not get deployment config: {e}")
        config = {"mode": "unknown", "use_async_processing": False}
    
    # Test dependencies with safe error handling
    deps = {}
    
    # Test FFmpeg
    try:
        import subprocess
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
        deps["ffmpeg"] = result.returncode == 0
    except Exception:
        deps["ffmpeg"] = False
    
    # Test AI/ML libraries (OpenAI Vision API replaces local models)
    try:
        import openai
        deps["openai"] = True
        deps["openai_version"] = openai.__version__
    except Exception:
        deps["openai"] = False
        
    try:
        import cv2
        deps["opencv"] = True
        deps["opencv_version"] = cv2.__version__
    except Exception:
        deps["opencv"] = False
    
    # Test custom services
    try:
        from services.video_conversion_service import video_conversion_service
        deps["video_conversion_service"] = video_conversion_service is not None
    except Exception:
        deps["video_conversion_service"] = False
        
    try:
        from services.openai_vision_service import openai_vision_service
        deps["ai_analysis_service"] = openai_vision_service is not None
    except Exception:
        deps["ai_analysis_service"] = False
    
    return {
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database_url": settings.DATABASE_URL[:30] + "..." if settings.DATABASE_URL else "None",
        "redis_connected": redis_client is not None,
        "deployment_mode": config["mode"],
        "use_async_processing": config["use_async_processing"],
        "redis_url_available": bool(settings.REDIS_URL) if hasattr(settings, 'REDIS_URL') else False,
        "dependencies": deps,
        "status": "running"
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
        reload=settings.ENVIRONMENT == "development",
        proxy_headers=True,
        forwarded_allow_ips="*"
    )