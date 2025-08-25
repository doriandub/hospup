#!/usr/bin/env python3

import os
import sys
import tempfile
import subprocess
import json
import boto3
from sqlalchemy.orm import Session
from core.database import get_db
from models.video import Video

def get_video_duration_ffprobe(video_path: str) -> float:
    """Extract video duration using ffprobe"""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_format', '-show_streams', video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)
        
        # Get duration from format or streams
        duration = None
        if 'format' in data and 'duration' in data['format']:
            duration = float(data['format']['duration'])
        elif 'streams' in data:
            for stream in data['streams']:
                if stream.get('codec_type') == 'video' and 'duration' in stream:
                    duration = float(stream['duration'])
                    break
        
        return duration
    except Exception as e:
        print(f"Error extracting duration: {e}")
        return None

def main():
    # Initialize AWS S3 client
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID', ''),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY', ''),
        region_name='eu-west-1'
    )
    bucket_name = 'hospup-files'
    
    db = next(get_db())
    
    try:
        # Get videos without duration
        videos_without_duration = db.query(Video).filter(
            Video.duration.is_(None),
            Video.video_url.is_not(None)
        ).all()
        
        print(f"Found {len(videos_without_duration)} videos without duration")
        
        for video in videos_without_duration:
            print(f"\nProcessing: {video.title} (ID: {video.id})")
            
            # Extract S3 key from video_url 
            if video.video_url.startswith("s3://"):
                s3_key = video.video_url.replace("s3://hospup-files/", "")
            elif video.video_url.startswith("https://hospup-files.s3.amazonaws.com/"):
                s3_key = video.video_url.split("amazonaws.com/")[1].split("?")[0]
            else:
                print(f"  Skipping - unknown URL format: {video.video_url}")
                continue
                
            print(f"  S3 Key: {s3_key}")
            
            # Download temporarily to get metadata
            with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp_file:
                try:
                    s3_client.download_file(bucket_name, s3_key, tmp_file.name)
                    print(f"  Downloaded to {tmp_file.name}")
                    
                    # Extract duration
                    duration = get_video_duration_ffprobe(tmp_file.name)
                    
                    if duration is not None:
                        print(f"  Duration: {duration:.2f} seconds")
                        
                        # Update database
                        video.duration = duration
                        db.commit()
                        print(f"  ✅ Updated database")
                    else:
                        print(f"  ❌ Could not extract duration")
                        
                except Exception as e:
                    print(f"  ❌ Error processing: {e}")
                finally:
                    # Clean up temp file
                    try:
                        os.unlink(tmp_file.name)
                    except:
                        pass
        
        print(f"\n🎉 Finished processing {len(videos_without_duration)} videos")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()