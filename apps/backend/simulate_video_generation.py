#!/usr/bin/env python3
"""
Simulate video generation completion for testing
"""

import asyncio
import time
from pathlib import Path
import sys

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from core.database import SessionLocal
from models.video import Video

async def simulate_video_generation():
    """Simulate video generation by updating processing videos to completed"""
    
    print("🎬 Simulating video generation completion...")
    
    db = SessionLocal()
    try:
        # Find videos in processing status
        processing_videos = db.query(Video).filter(Video.status == "processing").all()
        
        if not processing_videos:
            print("No videos currently processing")
            return
        
        for video in processing_videos:
            print(f"Processing video: {video.title} (ID: {video.id})")
            
            # Wait a bit to simulate processing time
            await asyncio.sleep(2)
            
            # Update to completed status with mock URLs
            video.status = "completed"
            video.video_url = f"https://mockbucket.s3.amazonaws.com/videos/{video.id}.mp4"
            video.thumbnail_url = f"https://mockbucket.s3.amazonaws.com/thumbnails/{video.id}.jpg"
            
            print(f"✅ Completed: {video.title}")
        
        db.commit()
        print(f"\n🎉 Simulated completion of {len(processing_videos)} videos")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(simulate_video_generation())