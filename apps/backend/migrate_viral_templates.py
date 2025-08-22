#!/usr/bin/env python3
"""
Migration script to add new columns to viral_video_templates table
"""

from sqlalchemy import text
from core.database import SessionLocal, engine

def migrate_viral_templates():
    """Add new columns to viral_video_templates table"""
    
    print("🔄 Starting migration of viral_video_templates table...")
    
    db = SessionLocal()
    
    try:
        # Add new columns for SQLite
        new_columns = [
            ("hotel_name", "TEXT"),
            ("username", "TEXT"),
            ("country", "TEXT"),
            ("video_link", "TEXT"),
            ("account_link", "TEXT"),
            ("followers", "REAL"),
            ("views", "REAL"),
            ("likes", "REAL"),
            ("comments", "REAL"),
            ("script", "TEXT")  # JSON stored as TEXT in SQLite
        ]
        
        for column_name, column_type in new_columns:
            try:
                # For SQLite, check columns using PRAGMA
                check_query = text("PRAGMA table_info(viral_video_templates)")
                result = db.execute(check_query).fetchall()
                
                column_exists = any(row[1] == column_name for row in result)
                
                if not column_exists:
                    # Add column if it doesn't exist
                    add_query = text(f"ALTER TABLE viral_video_templates ADD COLUMN {column_name} {column_type}")
                    db.execute(add_query)
                    print(f"✅ Added column: {column_name}")
                else:
                    print(f"⏭️  Column already exists: {column_name}")
                    
            except Exception as e:
                print(f"❌ Error adding column {column_name}: {e}")
        
        print("⚠️  Note: SQLite doesn't support changing column constraints easily")
        print("⚠️  The segments_pattern field can now be NULL in new records")
        
        db.commit()
        print("🎉 Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_viral_templates()