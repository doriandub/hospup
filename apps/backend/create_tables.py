#!/usr/bin/env python3
"""
Script pour créer les tables en production
"""

from sqlalchemy import create_engine, text
from core.database import Base
from core.config import settings
from models.user import User
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DATABASE_URL[:50]}...")
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        # Test connection
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Tables créées avec succès!")
        
        # Verify tables exist
        with engine.connect() as connection:
            result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table';" if "sqlite" in settings.DATABASE_URL else "SELECT tablename FROM pg_tables WHERE schemaname='public';"))
            tables = [row[0] for row in result.fetchall()]
            logger.info(f"Tables créées: {tables}")
        
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        raise

if __name__ == "__main__":
    create_tables()