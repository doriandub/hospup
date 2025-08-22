#!/usr/bin/env python3
"""
Fix demo users with correct password hashing
"""

from pathlib import Path
import sys

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from core.database import SessionLocal
from core.security import get_password_hash
from models.user import User

def fix_demo_users():
    """Fix existing demo users with correct password hashing"""
    
    print("🔧 Fixing demo users with correct password hashing...")
    
    db = SessionLocal()
    try:
        # Update demo user
        demo_user = db.query(User).filter(User.email == "demo@hospup.com").first()
        if demo_user:
            demo_user.password_hash = get_password_hash("demo123")
            print("✅ Fixed demo user password hash")
        else:
            # Create demo user
            demo_user = User(
                email="demo@hospup.com",
                name="Demo User",
                password_hash=get_password_hash("demo123"),
                plan="pro",
                videos_limit=100,
                is_active=True,
                email_verified=True
            )
            db.add(demo_user)
            print("✅ Created demo user")
        
        # Update admin user  
        admin_user = db.query(User).filter(User.email == "admin@hospup.com").first()
        if admin_user:
            admin_user.password_hash = get_password_hash("admin123")
            print("✅ Fixed admin user password hash")
        else:
            # Create admin user
            admin_user = User(
                email="admin@hospup.com",
                name="Admin User", 
                password_hash=get_password_hash("admin123"),
                plan="enterprise",
                videos_limit=-1,
                is_active=True,
                email_verified=True
            )
            db.add(admin_user)
            print("✅ Created admin user")
        
        db.commit()
        
        print(f"\n🎉 Users ready!")
        print("=" * 30)
        print(f"🔑 Demo Login:")
        print(f"   URL: http://localhost:3001/auth/login")
        print(f"   Email: demo@hospup.com")
        print(f"   Password: demo123")
        
        print(f"\n🔑 Admin Login:")
        print(f"   URL: http://localhost:3001/auth/login")
        print(f"   Email: admin@hospup.com")
        print(f"   Password: admin123")
        
        print(f"\n🎯 After login, go to:")
        print(f"   http://localhost:3001/admin/viral-matching")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing users: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = fix_demo_users()
    if success:
        print(f"\n✅ Users are ready to use!")
    else:
        print(f"\n❌ Failed to fix users")