"""
Version de debug pour identifier le problème de démarrage
"""
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Application FastAPI
app = FastAPI(title="Hospup Debug")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Debug app is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/debug")
async def debug():
    env_vars = {}
    for key in ["DATABASE_URL", "REDIS_URL", "PORT", "ENVIRONMENT"]:
        value = os.getenv(key)
        env_vars[key] = "SET" if value else "NOT_SET"
    
    return {
        "environment": env_vars,
        "python_path": os.getcwd(),
        "message": "Debug endpoint"
    }

logger.info("🚀 Debug app started successfully")