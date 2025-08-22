#!/usr/bin/env python3

import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.security import get_password_hash
from models.user import User
import uuid
from datetime import datetime

DATABASE_URL = "sqlite:///hospup_saas.db"

def create_test_user():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "demo@hospup.com").first()
        if existing_user:
            print("Test user demo@hospup.com already exists!")
            return
        
        # Create test user
        test_user = User(
            id=str(uuid.uuid4()),
            email="demo@hospup.com",
            name="Demo User",
            password_hash=get_password_hash("password123"),
            plan="free",
            videos_used=0,
            videos_limit=2,
            is_active=True,
            email_verified=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(test_user)
        db.commit()
        print("✅ Test user created successfully!")
        print("📧 Email: demo@hospup.com")
        print("🔑 Password: password123")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()