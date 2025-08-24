#!/usr/bin/env python3
"""
Script to clean up original uploaded files after video processing
Keeps only the processed/compressed versions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import SessionLocal
from models.video import Video
from sqlalchemy import text
import boto3
from datetime import datetime, timedelta
import json

def get_s3_client():
    """Get configured S3 client for cleanup operations"""
    return boto3.client(
        's3',
        region_name=os.getenv('AWS_CLEANUP_REGION', 'eu-west-1'),
        aws_access_key_id=os.getenv('AWS_CLEANUP_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_CLEANUP_SECRET_ACCESS_KEY')
    )

def find_original_files_to_cleanup():
    """Find original uploaded files that can be safely deleted"""
    db = SessionLocal()
    
    try:
        # Find videos that have been processed (status = 'completed' or similar)
        processed_videos = db.execute(text("""
            SELECT 
                id,
                title,
                video_url,
                status,
                created_at,
                size,
                source_data
            FROM videos 
            WHERE status IN ('uploaded', 'completed', 'processed')
            AND video_url LIKE 's3://hospup-files/%'
            AND created_at < NOW() - INTERVAL '1 hour'  -- At least 1 hour old
            ORDER BY created_at DESC
        """)).fetchall()
        
        print(f"🔍 Found {len(processed_videos)} processed videos")
        
        potential_cleanups = []
        
        for video in processed_videos:
            video_id, title, s3_url, status, created_at, size, source_data_json = video
            
            # Parse source_data if it exists
            source_data = {}
            if source_data_json:
                try:
                    source_data = json.loads(source_data_json) if isinstance(source_data_json, str) else source_data_json
                except:
                    pass
            
            # Extract S3 key from URL
            if s3_url and s3_url.startswith('s3://hospup-files/'):
                s3_key = s3_url.replace('s3://hospup-files/', '')
                
                # Check if this looks like a processed file vs original
                is_processed = (
                    'compressed' in s3_key.lower() or 
                    'processed' in s3_key.lower() or 
                    'optimized' in s3_key.lower() or
                    s3_key.endswith('_processed.mp4') or
                    s3_key.endswith('_compressed.mp4')
                )
                
                is_original = (
                    'original' in s3_key.lower() or 
                    'temp' in s3_key.lower() or
                    'upload' in s3_key.lower() or
                    s3_key.endswith('_original.mp4') or
                    s3_key.endswith('_temp.mp4')
                )
                
                file_info = {
                    'video_id': video_id,
                    'title': title,
                    'url': s3_url,
                    'key': s3_key,
                    'status': status,
                    'created_at': created_at,
                    'size_mb': round(size / 1024 / 1024, 2) if size else 0,
                    'is_processed': is_processed,
                    'is_original': is_original,
                    'source_data': source_data
                }
                
                if is_original and status in ['completed', 'processed']:
                    potential_cleanups.append(file_info)
                
                # Also check if there are multiple versions of the same video
                if not is_original and not is_processed:
                    # Look for patterns that suggest this could be an original
                    base_name = title.split('.')[0] if title else str(video_id)
                    
                    # Check if there's a corresponding processed version
                    processed_version = db.execute(text("""
                        SELECT COUNT(*) 
                        FROM videos 
                        WHERE id != :video_id 
                        AND (title LIKE :pattern1 OR title LIKE :pattern2)
                        AND status IN ('completed', 'processed')
                        AND created_at > :created_at
                    """), {
                        "video_id": video_id,
                        "pattern1": f"%{base_name}%processed%",
                        "pattern2": f"%{base_name}%compressed%",
                        "created_at": created_at
                    }).fetchone()[0]
                    
                    if processed_version > 0:
                        file_info['has_processed_version'] = True
                        potential_cleanups.append(file_info)
        
        return potential_cleanups
        
    except Exception as e:
        print(f"❌ Error finding files: {e}")
        return []
    finally:
        db.close()

def analyze_cleanup_potential(dry_run=True):
    """Analyze what files could be cleaned up"""
    print("🔍 Analyzing files for cleanup...")
    
    potential_cleanups = find_original_files_to_cleanup()
    
    if not potential_cleanups:
        print("✅ No files found for cleanup")
        return
    
    total_size_mb = sum(f['size_mb'] for f in potential_cleanups)
    
    print(f"\n📊 Cleanup Analysis:")
    print(f"  Files that could be cleaned: {len(potential_cleanups)}")
    print(f"  Total space savings: {total_size_mb:.1f} MB")
    
    print(f"\n📋 Files to clean:")
    for file_info in potential_cleanups[:10]:  # Show first 10
        print(f"  • {file_info['title']} ({file_info['size_mb']:.1f} MB)")
        print(f"    URL: {file_info['url']}")
        print(f"    Reason: {'Original file' if file_info['is_original'] else 'Has processed version'}")
        print()
    
    if len(potential_cleanups) > 10:
        print(f"    ... and {len(potential_cleanups) - 10} more files")
    
    if not dry_run:
        confirmation = input(f"\n⚠️  Delete {len(potential_cleanups)} files ({total_size_mb:.1f} MB)? [y/N]: ")
        if confirmation.lower() == 'y':
            delete_files(potential_cleanups)
        else:
            print("❌ Cleanup cancelled")

def delete_files(files_to_delete):
    """Actually delete the files from S3"""
    s3_client = get_s3_client()
    bucket = os.getenv('AWS_CLEANUP_BUCKET', 'hospup-files')
    
    deleted_count = 0
    deleted_size_mb = 0
    
    for file_info in files_to_delete:
        try:
            # Delete from S3
            s3_client.delete_object(Bucket=bucket, Key=file_info['key'])
            
            deleted_count += 1
            deleted_size_mb += file_info['size_mb']
            
            print(f"✅ Deleted: {file_info['title']} ({file_info['size_mb']:.1f} MB)")
            
            # Optionally update database to mark as cleaned
            # db.execute("UPDATE videos SET cleanup_status = 'cleaned' WHERE id = %s", file_info['video_id'])
            
        except Exception as e:
            print(f"❌ Failed to delete {file_info['title']}: {e}")
    
    print(f"\n🎉 Cleanup complete!")
    print(f"  Files deleted: {deleted_count}")
    print(f"  Space freed: {deleted_size_mb:.1f} MB")

if __name__ == "__main__":
    print("🧹 Original File Cleanup Tool")
    print("="*50)
    
    # Check AWS credentials
    if not os.getenv('AWS_CLEANUP_ACCESS_KEY_ID'):
        print("❌ AWS credentials not configured")
        print("Set AWS_CLEANUP_ACCESS_KEY_ID and AWS_CLEANUP_SECRET_ACCESS_KEY environment variables")
        sys.exit(1)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--delete":
        analyze_cleanup_potential(dry_run=False)
    else:
        analyze_cleanup_potential(dry_run=True)
        print("\nTo actually delete files, use: python cleanup_original_files.py --delete")