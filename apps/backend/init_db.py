#!/usr/bin/env python3
"""
Script to initialize the database tables.
Run this script to create all necessary tables.
"""

import logging
from core.database import engine, Base
from models.user import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize the database by creating all tables."""
    try:
        # Import all models to ensure they're registered
        from models.user import User
        
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
        
        # Verify tables were created
        with engine.connect() as conn:
            result = conn.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
            tables = [row[0] for row in result]
            logger.info(f"Created tables: {tables}")
            
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    init_database()