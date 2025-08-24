#!/usr/bin/env python3
"""
Script to clean up old file storage after migration to AWS S3
Removes old files that have been migrated to S3 format
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import SessionLocal
from models.video import Video
from sqlalchemy import text
import boto3
from urllib.parse import urlparse
import requests

def get_s3_client():
    """Get configured S3 client"""
    return boto3.client(
        's3',
        region_name='eu-west-1'  # Update with your region
    )

def cleanup_old_storage():
    """Clean up old file storage after S3 migration"""
    db = SessionLocal()
    s3_client = get_s3_client()
    
    try:
        # Find videos with old HTTPS URLs that also have S3 equivalents
        old_videos = db.execute(text("""
            SELECT id, video_url, title 
            FROM videos 
            WHERE video_url LIKE 'https://hospup-files.s3.amazon%'
            ORDER BY created_at DESC
        """)).fetchall()
        
        print(f"Found {len(old_videos)} videos with old HTTPS URLs")
        
        for video in old_videos:
            video_id, old_url, title = video
            print(f"\nProcessing: {title} ({video_id})")
            print(f"Old URL: {old_url}")
            
            # Check if there's a corresponding S3 URL for the same video
            s3_video = db.execute(text("""
                SELECT video_url 
                FROM videos 
                WHERE id = :video_id 
                AND video_url LIKE 's3://hospup-files/%'
            """), {"video_id": video_id}).fetchone()
            
            if s3_video:
                s3_url = s3_video[0]
                print(f"Found S3 equivalent: {s3_url}")
                
                # Verify S3 file exists
                bucket = 'hospup-files'
                key = s3_url.replace('s3://hospup-files/', '')
                
                try:
                    s3_client.head_object(Bucket=bucket, Key=key)
                    print(f"✅ S3 file confirmed to exist")
                    
                    # Optional: Delete old HTTPS-accessible file
                    # This depends on how your old storage works
                    # For now, just log what would be deleted
                    print(f"🗑️  Would delete old URL: {old_url}")
                    
                    # Update database to remove old URL reference if needed
                    # db.execute(text("UPDATE videos SET old_url = :old_url WHERE id = :id"), 
                    #           {"old_url": old_url, "id": video_id})
                    
                except Exception as e:
                    print(f"❌ S3 file not found: {e}")
                    continue
            else:
                print(f"⚠️  No S3 equivalent found - keeping old URL")
        
        # Find orphaned files - videos that exist only in old format
        orphaned_videos = db.execute(text("""
            SELECT id, video_url, title 
            FROM videos 
            WHERE video_url LIKE 'https://hospup-files.s3.amazon%'
            AND id NOT IN (
                SELECT id FROM videos WHERE video_url LIKE 's3://hospup-files/%'
            )
        """)).fetchall()
        
        print(f"\n📊 Summary:")
        print(f"- Total old HTTPS URLs: {len(old_videos)}")
        print(f"- Orphaned files (no S3 equivalent): {len(orphaned_videos)}")
        print(f"- Files that could be cleaned: {len(old_videos) - len(orphaned_videos)}")
        
        db.commit()
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

def list_storage_statistics():
    """Show storage statistics"""
    db = SessionLocal()
    
    try:
        # Storage type statistics
        stats = db.execute(text("""
            SELECT 
                CASE 
                    WHEN video_url LIKE 's3://hospup-files/%' THEN 'AWS S3'
                    WHEN video_url LIKE 'https://hospup-files.s3.amazon%' THEN 'Old HTTPS'
                    WHEN video_url IS NULL THEN 'No URL'
                    ELSE 'Other'
                END as storage_type,
                COUNT(*) as count
            FROM videos
            GROUP BY storage_type
            ORDER BY count DESC
        """)).fetchall()
        
        print("📊 Storage Statistics:")
        for storage_type, count in stats:
            print(f"  {storage_type}: {count} files")
            
        # Duplicate analysis
        duplicates = db.execute(text("""
            SELECT title, COUNT(*) as count
            FROM videos 
            WHERE title IS NOT NULL
            GROUP BY title
            HAVING COUNT(*) > 1
            ORDER BY count DESC
            LIMIT 10
        """)).fetchall()
        
        if duplicates:
            print(f"\n🔍 Potential Duplicates (by title):")
            for title, count in duplicates:
                print(f"  '{title}': {count} copies")
                
    except Exception as e:
        print(f"Error getting statistics: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🧹 File Storage Cleanup Tool")
    print("="*50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--cleanup":
        print("🚀 Starting cleanup process...")
        cleanup_old_storage()
    else:
        print("📈 Showing storage statistics...")
        list_storage_statistics()
        print("\nTo run cleanup, use: python cleanup_old_files.py --cleanup")