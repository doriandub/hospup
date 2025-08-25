#!/usr/bin/env python3

import os
import sys
import tempfile
import subprocess
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import boto3
from core.config import settings

def generate_thumbnail_from_video(video_path: str, output_path: str) -> bool:
    """Generate thumbnail from video using FFmpeg"""
    try:
        # Extract frame at 2 seconds (or 10% of video duration)
        cmd = [
            'ffmpeg', '-i', video_path, 
            '-ss', '2',  # 2 seconds into video
            '-vframes', '1',  # Extract 1 frame
            '-vf', 'scale=320:568:force_original_aspect_ratio=decrease,pad=320:568:(ow-iw)/2:(oh-ih)/2',  # Resize and pad to 9:16
            '-y',  # Overwrite output
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0 and os.path.exists(output_path)
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return False

def main():
    # Database connection
    conn = psycopg2.connect(
        host="hospup-db2.checoia2yosk.eu-west-1.rds.amazonaws.com",
        database="postgres",
        user="postgres",
        password="bSE10GhpRKVigbkEnzBG"
    )
    
    # Initialize S3 client
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID', ''),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY', ''),
        region_name='eu-west-1'
    )
    bucket_name = 'hospup-files'
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get videos that need real thumbnails
        cur.execute("""
            SELECT id, title, video_url 
            FROM videos 
            WHERE video_url IS NOT NULL 
              AND video_url LIKE 's3://%'
              AND status = 'uploaded'
            LIMIT 5
        """)
        videos = cur.fetchall()
        
        print(f"Processing {len(videos)} videos for thumbnail generation")
        
        for video in videos:
            print(f"\n🎬 Processing: {video['title']} (ID: {video['id']})")
            
            video_url = video['video_url']
            s3_key = video_url.replace("s3://hospup-files/", "")
            
            print(f"  S3 Key: {s3_key}")
            
            # Create temp directories
            with tempfile.TemporaryDirectory() as temp_dir:
                video_file = os.path.join(temp_dir, f"{video['id']}.mov")
                thumbnail_file = os.path.join(temp_dir, f"{video['id']}_thumbnail.jpg")
                
                try:
                    # Download video from S3
                    print(f"  📥 Downloading video...")
                    s3_client.download_file(bucket_name, s3_key, video_file)
                    
                    # Generate thumbnail
                    print(f"  🖼️ Generating thumbnail...")
                    if generate_thumbnail_from_video(video_file, thumbnail_file):
                        # Upload thumbnail to S3
                        thumbnail_s3_key = f"thumbnails/{video['id']}/{video['id']}_thumbnail.jpg"
                        print(f"  ☁️ Uploading thumbnail to S3: {thumbnail_s3_key}")
                        
                        s3_client.upload_file(
                            thumbnail_file, 
                            bucket_name, 
                            thumbnail_s3_key,
                            ExtraArgs={'ContentType': 'image/jpeg'}
                        )
                        
                        # Update database with real thumbnail URL
                        thumbnail_url = f"https://hospup-files.s3.amazonaws.com/{thumbnail_s3_key}"
                        cur.execute("""
                            UPDATE videos 
                            SET thumbnail_url = %s 
                            WHERE id = %s
                        """, (thumbnail_url, video['id']))
                        conn.commit()
                        
                        print(f"  ✅ Thumbnail generated and uploaded successfully")
                    else:
                        print(f"  ❌ Failed to generate thumbnail")
                        
                except Exception as e:
                    print(f"  ❌ Error processing video: {e}")
                    # Fallback to placeholder
                    placeholder_url = f"https://via.placeholder.com/320x568/1f2937/f9fafb?text={video['title'][:20]}"
                    cur.execute("""
                        UPDATE videos 
                        SET thumbnail_url = %s 
                        WHERE id = %s
                    """, (placeholder_url, video['id']))
                    conn.commit()
        
        print(f"\n🎉 Finished processing {len(videos)} videos")
        
    finally:
        conn.close()

if __name__ == "__main__":
    main()