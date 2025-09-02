"""
Version minimale de main.py pour tester le démarrage sur Railway
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Application FastAPI minimale
app = FastAPI(
    title="Hospup Backend (Minimal)",
    description="Version minimale pour test de déploiement Railway",
    version="1.0.0"
)

# CORS simple
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hospup Backend is running!", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "hospup-backend-minimal"}

@app.get("/debug")
async def debug():
    import sys
    import os
    
    return {
        "python_version": sys.version,
        "environment_vars": {
            "PORT": os.getenv("PORT", "not_set"),
            "DATABASE_URL": "***" if os.getenv("DATABASE_URL") else "not_set",
            "REDIS_URL": "***" if os.getenv("REDIS_URL") else "not_set",
        },
        "message": "Minimal backend debugging info"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)