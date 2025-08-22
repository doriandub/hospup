#!/usr/bin/env python3
"""
Create a demo user for testing the viral matching system
"""

from pathlib import Path
import sys

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from core.database import SessionLocal
from core.security import get_password_hash
from models.user import User

def create_demo_user():
    """Create a demo user for testing"""
    
    print("👤 Creating demo user...")
    
    db = SessionLocal()
    try:
        # Check if demo user already exists
        existing_user = db.query(User).filter(User.email == "demo@hospup.com").first()
        if existing_user:
            print("✅ Demo user already exists!")
            print(f"   Email: demo@hospup.com")
            print(f"   Password: demo123")
            print(f"   User ID: {existing_user.id}")
            return existing_user
        
        # Create password hash using bcrypt
        password = "demo123"
        password_hash = get_password_hash(password)
        
        # Create demo user
        demo_user = User(
            email="demo@hospup.com",
            name="Demo User",
            password_hash=password_hash,
            plan="pro",  # Give pro plan for testing
            videos_limit=100,  # Generous limit
            is_active=True,
            email_verified=True
        )
        
        db.add(demo_user)
        db.commit()
        
        print("✅ Demo user created successfully!")
        print(f"   Email: demo@hospup.com")
        print(f"   Password: demo123")
        print(f"   User ID: {demo_user.id}")
        print(f"   Plan: {demo_user.plan}")
        
        return demo_user
        
    except Exception as e:
        print(f"❌ Error creating demo user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def create_admin_user():
    """Create an admin user"""
    
    print("\n👨‍💼 Creating admin user...")
    
    db = SessionLocal()
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.email == "admin@hospup.com").first()
        if existing_admin:
            print("✅ Admin user already exists!")
            print(f"   Email: admin@hospup.com")
            print(f"   Password: admin123")
            print(f"   User ID: {existing_admin.id}")
            return existing_admin
        
        # Create password hash using bcrypt
        password = "admin123"
        password_hash = get_password_hash(password)
        
        # Create admin user
        admin_user = User(
            email="admin@hospup.com",
            name="Admin User",
            password_hash=password_hash,
            plan="enterprise",  # Enterprise plan
            videos_limit=-1,  # Unlimited
            is_active=True,
            email_verified=True
        )
        
        db.add(admin_user)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print(f"   Email: admin@hospup.com")
        print(f"   Password: admin123")
        print(f"   User ID: {admin_user.id}")
        print(f"   Plan: {admin_user.plan}")
        
        return admin_user
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def main():
    """Main function"""
    print("🔐 Creating Test Users for Hospup")
    print("=" * 40)
    
    # Create demo user
    demo_user = create_demo_user()
    
    # Create admin user
    admin_user = create_admin_user()
    
    print(f"\n🎉 Users Ready!")
    print("=" * 30)
    
    if demo_user:
        print(f"🔑 Demo Login:")
        print(f"   URL: http://localhost:3001/auth/login")
        print(f"   Email: demo@hospup.com")
        print(f"   Password: demo123")
    
    if admin_user:
        print(f"\n🔑 Admin Login:")
        print(f"   URL: http://localhost:3001/auth/login")
        print(f"   Email: admin@hospup.com")
        print(f"   Password: admin123")
    
    print(f"\n🎯 After login, go to:")
    print(f"   http://localhost:3001/admin/viral-matching")
    print(f"   Property: Sémaphore de Lervily")
    print(f"   Property ID: 3b56a01f-a874-4355-abeb-95c1e43d44fb")

if __name__ == "__main__":
    main()