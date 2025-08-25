#!/usr/bin/env python3
"""
Quick script to fix videos stuck in processing status
Run this if videos are not showing up after upload
"""

import os
import sys
from datetime import datetime, timedelta

# Add the backend directory to the path
sys.path.append(os.path.dirname(__file__))

from core.database import SessionLocal

def fix_stuck_videos():
    """Fix videos that have been in processing status for too long"""
    db = SessionLocal()
    
    try:
        # Update videos stuck in processing for more than 2 minutes
        cutoff_time = datetime.utcnow() - timedelta(minutes=2)
        
        # Execute raw SQL for simplicity
        result = db.execute("""
            UPDATE videos 
            SET status = 'uploaded', 
                description = COALESCE(description, '') || CASE 
                    WHEN description IS NULL OR description = '' 
                    THEN 'Uploaded video: ' || title 
                    ELSE ' (Processing recovered)' 
                END
            WHERE status = 'processing' 
            AND created_at < :cutoff_time
        """, {"cutoff_time": cutoff_time})
        
        db.commit()
        
        updated_count = result.rowcount
        print(f"✅ Fixed {updated_count} stuck videos")
        
        # Show current status summary
        status_result = db.execute("""
            SELECT status, COUNT(*) as count 
            FROM videos 
            GROUP BY status 
            ORDER BY count DESC
        """)
        
        print("\n📊 Current video status summary:")
        for row in status_result:
            print(f"   {row[0]}: {row[1]} videos")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_stuck_videos()