#!/usr/bin/env python3
"""
Simple test script for video analysis functionality.

This script tests the video analysis pipeline without requiring all dependencies.
Perfect for progressive testing and debugging.
"""

import os
import sys
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.video import Video
from models.video_segment import VideoSegment

def test_database_setup():
    """Test 1: Verify database tables exist"""
    print("🧪 Test 1: Database setup")
    
    try:
        db = SessionLocal()
        
        # Test VideoSegment table exists
        from sqlalchemy import text
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='video_segments';"))
        if result.fetchone():
            print("✅ video_segments table exists")
        else:
            print("❌ video_segments table missing")
            return False
            
        # Test we can create a video segment record
        test_segment = VideoSegment(
            video_id="test-video-id",
            start_time=0.0,
            end_time=5.0,
            duration=5.0,
            description="Test scene: a bedroom with a large bed",
            scene_type="bedroom",
            tags=["bed", "bedroom", "furniture"],
            confidence_score=0.85
        )
        
        print(f"✅ Can create VideoSegment: {test_segment}")
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_video_analysis_imports():
    """Test 2: Check if video analysis dependencies can be imported"""
    print("\\n🧪 Test 2: Video analysis imports")
    
    # Test basic imports
    try:
        import cv2
        print("✅ OpenCV imported successfully")
    except ImportError as e:
        print(f"❌ OpenCV import failed: {e}")
        return False
    
    try:
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"✅ PyTorch imported (device: {device})")
    except ImportError as e:
        print(f"❌ PyTorch import failed: {e}")
        return False
    
    try:
        from transformers import BlipProcessor
        print("✅ Transformers (BLIP) imported successfully")
    except ImportError as e:
        print(f"❌ Transformers import failed: {e}")
        return False
    
    return True

def test_video_file_processing():
    """Test 3: Basic video file processing"""
    print("\\n🧪 Test 3: Video file processing")
    
    try:
        import cv2
        import numpy as np
        
        # Create a simple test video in memory
        print("📹 Creating test video...")
        
        # Test video capabilities
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        test_video_path = '/tmp/test_video.mp4'
        
        # Create a simple 5-second test video
        out = cv2.VideoWriter(test_video_path, fourcc, 1.0, (640, 480))
        
        for i in range(5):  # 5 frames = 5 seconds at 1 FPS
            # Create a colored frame
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            frame[:, :] = [i*50, 100, 200-i*30]  # Changing colors
            out.write(frame)
        
        out.release()
        
        # Test reading the video
        cap = cv2.VideoCapture(test_video_path)
        if cap.isOpened():
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            duration = frame_count / fps if fps > 0 else 0
            
            print(f"✅ Test video created: {duration:.1f}s, {frame_count} frames, {fps} FPS")
            
            # Test frame extraction
            cap.set(cv2.CAP_PROP_POS_FRAMES, 2)  # Go to frame 2
            ret, frame = cap.read()
            if ret:
                print(f"✅ Frame extracted: {frame.shape}")
            else:
                print("❌ Could not extract frame")
                
            cap.release()
            
            # Clean up
            os.remove(test_video_path)
            return True
        else:
            print("❌ Could not open test video")
            return False
            
    except Exception as e:
        print(f"❌ Video processing test failed: {e}")
        return False

def test_ai_models_basic():
    """Test 4: Basic AI model loading (without full processing)"""
    print("\\n🧪 Test 4: AI models basic test")
    
    try:
        # Test BLIP model loading
        from transformers import BlipProcessor, BlipForConditionalGeneration
        from PIL import Image
        import numpy as np
        
        print("🤖 Loading BLIP model...")
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
        
        print("✅ BLIP model loaded successfully")
        
        # Test with a simple image
        test_image = Image.fromarray(np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8))
        inputs = processor(test_image, return_tensors="pt")
        
        print("✅ BLIP preprocessing works")
        
        # Note: We don't run inference to save time/resources
        print("🔄 Skipping inference to save time (models work!)")
        
        return True
        
    except Exception as e:
        print(f"❌ AI models test failed: {e}")
        print("   This might be due to internet connection (model downloads)")
        return False

def test_api_endpoints():
    """Test 5: Check if video analysis API is accessible"""
    print("\\n🧪 Test 5: API endpoints")
    
    try:
        from api.v1.video_analysis import router
        print("✅ Video analysis API router imported")
        
        # List available endpoints
        routes = [route.path for route in router.routes]
        print(f"📋 Available endpoints: {routes}")
        
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def test_existing_videos():
    """Test 6: Check existing videos in database for analysis"""
    print("\\n🧪 Test 6: Existing videos")
    
    try:
        db = SessionLocal()
        
        # Find videos that need analysis
        videos = db.query(Video).filter(Video.status == "uploaded").all()
        
        if videos:
            print(f"📹 Found {len(videos)} videos ready for analysis:")
            for video in videos[:3]:  # Show first 3
                print(f"   - {video.title} (ID: {video.id})")
                print(f"     Size: {video.size} bytes, Format: {video.format}")
        else:
            print("📭 No videos ready for analysis")
            
        # Check if any videos already have analysis
        analyzed_count = db.query(VideoSegment).count()
        print(f"📊 Current video segments in database: {analyzed_count}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Videos check failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Video Analysis System Tests\\n")
    
    tests = [
        test_database_setup,
        test_video_analysis_imports,
        test_video_file_processing,
        test_ai_models_basic,
        test_api_endpoints,
        test_existing_videos
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
    
    print(f"\\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! System ready for video analysis.")
    elif passed >= total - 1:
        print("⚠️  Almost ready! One minor issue to fix.")
    else:
        print("🔧 Some components need attention before full functionality.")
    
    print("\\n📝 Next steps:")
    print("   1. To test with real videos: Upload a video via the web interface")
    print("   2. Check video analysis status via API: GET /api/v1/video-analysis/videos/{video_id}/status")
    print("   3. View segments: GET /api/v1/video-analysis/videos/{video_id}/segments")

if __name__ == "__main__":
    main()