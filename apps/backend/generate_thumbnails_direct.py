#!/usr/bin/env python3

import os
import sys
import tempfile
import subprocess
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

def generate_thumbnail_ffmpeg(video_path: str, output_path: str, timestamp: str = "2") -> bool:
    """Generate thumbnail using FFmpeg at specified timestamp"""
    try:
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-ss", timestamp,  # Extract frame at timestamp
            "-vframes", "1",  # Extract only 1 frame
            "-vf", "scale=640:1138:force_original_aspect_ratio=decrease,pad=640:1138:(ow-iw)/2:(oh-ih)/2:black",  # 9:16 aspect
            "-q:v", "2",  # High quality
            "-pix_fmt", "yuv420p",  # Compatible pixel format
            output_path
        ]
        
        print(f"  📸 FFmpeg command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and os.path.exists(output_path):
            print(f"  ✅ Thumbnail generated successfully")
            return True
        else:
            print(f"  ❌ FFmpeg failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error generating thumbnail: {e}")
        return False

def main():
    # Database connection
    conn = psycopg2.connect(
        host="hospup-db2.checoia2yosk.eu-west-1.rds.amazonaws.com",
        database="postgres", 
        user="postgres",
        password="bSE10GhpRKVigbkEnzBG"
    )
    
    # S3 client
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID', ''),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY', ''),
        region_name='eu-west-1'
    )
    bucket_name = 'hospup-files'
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get recent videos that need thumbnails - use the working video system
        cur.execute("""
            SELECT id, title, video_url 
            FROM videos 
            WHERE video_url IS NOT NULL 
              AND video_url LIKE 's3://%'
              AND status = 'uploaded'
              AND created_at > NOW() - INTERVAL '2 hours'
            LIMIT 3
        """)
        videos = cur.fetchall()
        
        print(f"🎬 Processing {len(videos)} recent videos for thumbnail generation")
        
        for video in videos:
            print(f"\n📱 Processing: {video['title']} (ID: {video['id']})")
            
            s3_key = video['video_url'].replace("s3://hospup-files/", "")
            print(f"  📂 S3 Key: {s3_key}")
            
            with tempfile.TemporaryDirectory() as temp_dir:
                video_file = os.path.join(temp_dir, f"{video['id']}.mov")
                thumbnail_file = os.path.join(temp_dir, f"{video['id']}_thumbnail.jpg")
                
                try:
                    # Download video from S3
                    print(f"  ⬇️ Downloading video from S3...")
                    s3_client.download_file(bucket_name, s3_key, video_file)
                    
                    # Generate thumbnail at 2 seconds (like the original system)
                    print(f"  🖼️ Generating thumbnail at 2 seconds...")
                    if generate_thumbnail_ffmpeg(video_file, thumbnail_file, "2"):
                        # Upload to S3
                        thumbnail_s3_key = f"thumbnails/{video['id']}/{video['id']}_thumbnail.jpg"
                        print(f"  ☁️ Uploading to S3: {thumbnail_s3_key}")
                        
                        s3_client.upload_file(
                            thumbnail_file,
                            bucket_name,
                            thumbnail_s3_key,
                            ExtraArgs={'ContentType': 'image/jpeg', 'ACL': 'public-read'}
                        )
                        
                        # Update database with the EXACT same URL format as working videos
                        thumbnail_url = f"https://hospup-files.s3.amazonaws.com/thumbnails/{video['id']}/{video['id']}_thumbnail.jpg"
                        cur.execute("""
                            UPDATE videos 
                            SET thumbnail_url = %s 
                            WHERE id = %s
                        """, (thumbnail_url, video['id']))
                        conn.commit()
                        
                        print(f"  ✅ Real thumbnail generated and uploaded successfully!")
                    else:
                        print(f"  ❌ Failed to generate thumbnail")
                        
                except Exception as e:
                    print(f"  ❌ Error processing video: {e}")
        
        print(f"\n🎉 Finished processing {len(videos)} videos")
        
    finally:
        conn.close()

if __name__ == "__main__":
    main()