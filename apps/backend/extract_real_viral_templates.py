#!/usr/bin/env python3
"""
Extract viral templates from the actual viral video database
and test matching with Sémaphore de Lervilly hotel videos.
"""

import json
from pathlib import Path
import sys

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from core.database import SessionLocal
from models.viral_video_template import ViralVideoTemplate
from models.property import Property
from models.video import Video
from models.video_segment import VideoSegment
from services.viral_matching_service import viral_matching_service

def extract_viral_data_from_database():
    """Extract viral video data from localStorage or wherever it's stored"""
    print("🔍 Looking for viral video data in the database...")
    
    # For now, let's check what we have in the viral templates table
    db = SessionLocal()
    try:
        existing_templates = db.query(ViralVideoTemplate).all()
        print(f"Found {len(existing_templates)} existing templates in database")
        
        for template in existing_templates:
            print(f"  - {template.title} ({template.category})")
        
        return existing_templates
    finally:
        db.close()

def find_semaphore_hotel():
    """Find the Sémaphore de Lervilly hotel and its videos"""
    print("\n🏨 Looking for Sémaphore de Lervilly hotel...")
    
    db = SessionLocal()
    try:
        # Search for properties with similar names
        properties = db.query(Property).filter(
            Property.name.like('%Sémaphore%') | 
            Property.name.like('%Lervilly%') |
            Property.name.like('%semaphore%') |
            Property.name.like('%lervilly%')
        ).all()
        
        if not properties:
            # If not found, list all properties
            print("⚠️  Sémaphore de Lervilly not found. Available properties:")
            all_properties = db.query(Property).all()
            for prop in all_properties:
                videos_count = db.query(Video).filter(Video.property_id == prop.id).count()
                print(f"  - {prop.name} (ID: {prop.id}) - {videos_count} videos")
            return None, []
        
        hotel = properties[0]
        print(f"✅ Found hotel: {hotel.name} (ID: {hotel.id})")
        
        # Get videos for this property
        videos = db.query(Video).filter(Video.property_id == hotel.id).all()
        print(f"📹 Found {len(videos)} videos:")
        
        for video in videos:
            segments_count = db.query(VideoSegment).filter(VideoSegment.video_id == video.id).count()
            print(f"  - {video.title} ({video.duration}s) - {segments_count} segments")
        
        return hotel, videos
        
    finally:
        db.close()

def create_templates_from_viral_db_data():
    """Create templates from the 3 viral videos you added to the database"""
    print("\n🎬 Creating templates from your viral video data...")
    
    # These are the 3 examples you mentioned you added
    # We'll need to extract them from your actual data source
    
    # For now, let's check if we can find any patterns in localStorage or database
    # You mentioned you have data in the admin interface, so let's simulate that
    
    sample_viral_videos = [
        {
            "hotel_name": "Viens on part loin 🌍✈️",
            "username": "viensonpartloin_",
            "country": "France", 
            "video_link": "https://www.instagram.com/p/DNcv2FosD_6/",
            "account_link": "https://www.instagram.com/viensonpartloin_/",
            "followers": 235000,
            "views": 1170352,
            "likes": 22206,
            "comments": 299,
            "duration": 12.0,
            "script": {
                "clips": [
                    {
                        "order": 1,
                        "duration": 3.80,
                        "description": "Airplane view of clouds from a window, two figures walking on the clouds, daytime, high angle, wide shot, surreal, cinematic."
                    },
                    {
                        "order": 2,
                        "duration": 7.30,
                        "description": "Airplane view of clouds from a window, single figure walking on the clouds, daytime, high angle, wide shot, surreal, cinematic."
                    },
                    {
                        "order": 3,
                        "duration": 1.10,
                        "description": "Airplane view of clouds from a window, group of figures standing on the clouds, daytime, high angle, wide shot, surreal, cinematic."
                    }
                ],
                "texts": [
                    {
                        "content": "DEPUIS SON HUBLOT, ELLE FILME UNE SCÈNE\\nSURRÉALISTE DANS LES NUAGES… 🫙",
                        "start": 0.00,
                        "end": 3.80,
                        "anchor": "top_center",
                        "x": 0.50,
                        "y": 0.12,
                        "font_family": "Poppins",
                        "weight": 400,
                        "size_rel": 0.035,
                        "color": "#000000"
                    }
                ]
            }
        }
        # Add the other 2 viral videos here based on your actual data
    ]
    
    return sample_viral_videos

def analyze_semaphore_videos(hotel, videos):
    """Analyze the Sémaphore hotel videos to understand what content we have"""
    if not hotel or not videos:
        return
        
    print(f"\n🔍 Analyzing {hotel.name} videos for viral potential...")
    
    db = SessionLocal()
    try:
        for video in videos:
            print(f"\n📹 Video: {video.title}")
            print(f"   Duration: {video.duration}s")
            print(f"   Status: {video.status}")
            
            # Get segments for this video
            segments = db.query(VideoSegment).filter(VideoSegment.video_id == video.id).all()
            
            if segments:
                print(f"   Segments ({len(segments)}):")
                for segment in segments:
                    print(f"     - {segment.scene_type}: {segment.duration:.1f}s - {segment.description[:50]}...")
            else:
                print("   ⚠️  No segments found - video needs to be analyzed first")
                
    finally:
        db.close()

def test_real_viral_matching(property_id):
    """Test viral matching with the real hotel data"""
    print(f"\n🎯 Testing viral matching for {property_id}...")
    
    try:
        matches = viral_matching_service.find_matching_templates(
            property_id=property_id,
            min_match_score=0.1  # Very low threshold to see any potential matches
        )
        
        if matches:
            print(f"✅ Found {len(matches)} potential matches:")
            
            for i, match in enumerate(matches, 1):
                template = match["template"]
                print(f"\n🎬 Match #{i}: {template['title']}")
                print(f"   Category: {template['category']}")
                print(f"   Match Score: {match['match_score']:.1%}")
                print(f"   Can Create: {'✅ Yes' if match['can_create'] else '❌ No'}")
                print(f"   Matched Segments: {len(match['matched_segments'])}")
                print(f"   Missing Segments: {len(match['missing_segments'])}")
                
                if match['missing_segments']:
                    print("   Missing content:")
                    for missing in match['missing_segments']:
                        print(f"     - {missing['reason']}")
        else:
            print("❌ No matches found with current content")
            print("\n💡 This could mean:")
            print("   1. Videos need to be analyzed first (create segments)")
            print("   2. Scene types don't match viral templates")
            print("   3. Need more diverse hotel content")
            
    except Exception as e:
        print(f"❌ Error during matching: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main function to extract real data and test matching"""
    print("🎬 Real Viral Video Matching Test")
    print("Using actual data from your database")
    print("=" * 50)
    
    # Step 1: Check existing viral templates
    existing_templates = extract_viral_data_from_database()
    
    # Step 2: Find Sémaphore de Lervilly hotel
    hotel, videos = find_semaphore_hotel()
    
    if not hotel:
        print("\n❌ Could not find Sémaphore de Lervilly hotel")
        print("Please check the property name or create test data")
        return
    
    # Step 3: Analyze hotel videos
    analyze_semaphore_videos(hotel, videos)
    
    # Step 4: Test viral matching
    test_real_viral_matching(hotel.id)
    
    # Step 5: Summary and next steps
    print(f"\n🎉 Analysis Complete")
    print("=" * 30)
    print(f"✅ Hotel: {hotel.name}")
    print(f"✅ Videos: {len(videos)}")
    print(f"✅ Templates: {len(existing_templates)}")
    
    print(f"\n🚀 Next steps:")
    print(f"   1. Ensure videos are analyzed (have segments)")
    print(f"   2. Create viral templates from your 3 examples")
    print(f"   3. Test matching with http://localhost:3001/admin/viral-matching")
    print(f"   4. Property ID to use: {hotel.id}")

if __name__ == "__main__":
    main()