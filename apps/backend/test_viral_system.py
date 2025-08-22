#!/usr/bin/env python3
"""
Test script for the viral video matching system.

This script tests the complete workflow:
1. Create sample property and video data
2. Test template matching
3. Test reconstruction suggestions
"""

import json
from pathlib import Path
import sys

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from core.database import SessionLocal
from models.user import User
from models.property import Property
from models.video import Video
from models.video_segment import VideoSegment
from models.viral_video_template import ViralVideoTemplate
from services.viral_matching_service import viral_matching_service

def create_test_data():
    """Create test data for viral matching"""
    db = SessionLocal()
    
    try:
        # Check if test data already exists
        test_property = db.query(Property).filter(Property.name == "Test Luxury Hotel").first()
        if test_property:
            print("✅ Test data already exists")
            return test_property.id
        
        # Create test user
        test_user = User(
            id="test_user_001",
            email="test@hospup.com",
            name="Test User",
            password_hash="dummy_hash"
        )
        db.add(test_user)
        
        # Create test property
        test_property = Property(
            id="test_property_001",
            user_id="test_user_001",
            name="Test Luxury Hotel",
            type="hotel",
            city="Paradise City",
            country="Wonderland",
            description="A beautiful luxury hotel for testing viral video matching"
        )
        db.add(test_property)
        
        # Create test video
        test_video = Video(
            id="test_video_001",
            title="Hotel Tour Video",
            description="Luxury hotel tour showcasing amenities",
            video_url="/test/path/hotel_tour.mp4",
            duration=25.0,
            size=50000000,  # 50MB
            status="completed",
            user_id="test_user_001",
            property_id="test_property_001"
        )
        db.add(test_video)
        
        # Create test segments that match our viral templates
        test_segments = [
            # Hotel room segments (matches "Hotel Morning Routine" and "Hotel Room Tour")
            VideoSegment(
                id="seg_001",
                video_id="test_video_001",
                start_time=0.0,
                end_time=4.0,
                duration=4.0,
                description="Luxury hotel bedroom with king size bed, elegant décor, morning natural lighting, aesthetic room setup",
                scene_type="hotel_room",
                confidence_score=0.92
            ),
            VideoSegment(
                id="seg_002",
                video_id="test_video_001",
                start_time=4.0,
                end_time=8.0,
                duration=4.0,
                description="Hotel bathroom with marble surfaces, luxury amenities, high-end fixtures",
                scene_type="bathroom",
                confidence_score=0.88
            ),
            VideoSegment(
                id="seg_003",
                video_id="test_video_001",
                start_time=8.0,
                end_time=12.0,
                duration=4.0,
                description="Room service breakfast presentation, luxury food styling, hotel dining",
                scene_type="restaurant",
                confidence_score=0.85
            ),
            # Add airplane segment (though less likely in hotel videos)
            VideoSegment(
                id="seg_004",
                video_id="test_video_001",
                start_time=12.0,
                end_time=16.0,
                duration=4.0,
                description="View from hotel balcony showing clouds and sky, cinematic wide shot",
                scene_type="balcony",
                confidence_score=0.75
            ),
            # Add general luxury segments
            VideoSegment(
                id="seg_005",
                video_id="test_video_001",
                start_time=16.0,
                end_time=20.0,
                duration=4.0,
                description="Hotel lobby entrance, luxury interior design, elegant reception area",
                scene_type="lobby",
                confidence_score=0.90
            ),
            VideoSegment(
                id="seg_006",
                video_id="test_video_001",
                start_time=20.0,
                end_time=25.0,
                duration=5.0,
                description="Hotel spa area, wellness facilities, luxury relaxation space",
                scene_type="spa",
                confidence_score=0.87
            )
        ]
        
        for segment in test_segments:
            db.add(segment)
        
        db.commit()
        print("✅ Test data created successfully")
        
        # Display created data
        print(f"\n📊 Created test data:")
        print(f"   Property: {test_property.name} (ID: {test_property.id})")
        print(f"   Video: {test_video.title} ({test_video.duration}s)")
        print(f"   Segments: {len(test_segments)} analyzed segments")
        
        return test_property.id
        
    except Exception as e:
        print(f"❌ Error creating test data: {e}")
        db.rollback()
        return None
    finally:
        db.close()

def test_viral_matching(property_id: str):
    """Test the viral matching system"""
    print(f"\n🎯 Testing viral matching for property: {property_id}")
    print("=" * 60)
    
    try:
        # Find matching templates
        matches = viral_matching_service.find_matching_templates(
            property_id=property_id,
            min_match_score=0.3  # Lower threshold for testing
        )
        
        if not matches:
            print("❌ No matches found")
            return
        
        print(f"✅ Found {len(matches)} matching templates:")
        
        for i, match in enumerate(matches, 1):
            template = match["template"]
            print(f"\n🎬 Match #{i}: {template['title']}")
            print(f"   Category: {template['category']}")
            print(f"   Match Score: {match['match_score']:.1%}")
            print(f"   Can Create: {'✅ Yes' if match['can_create'] else '❌ No'}")
            print(f"   Suggested Duration: {match['suggested_duration']:.1f}s")
            print(f"   Matched Segments: {len(match['matched_segments'])}")
            print(f"   Missing Segments: {len(match['missing_segments'])}")
            
            if match['matched_segments']:
                print(f"   📹 Available clips:")
                for seg_match in match['matched_segments']:
                    best = seg_match['best_match']
                    print(f"      - {best['scene_type']}: {best['duration']:.1f}s ({best['confidence_score']:.1%} confidence)")
            
            if match['missing_segments']:
                print(f"   ❌ Missing clips:")
                for missing in match['missing_segments']:
                    print(f"      - {missing['reason']}")
        
        # Test reconstruction for the best match
        if matches and matches[0]['can_create']:
            print(f"\n🔧 Testing reconstruction for best match...")
            best_template_id = None
            
            # Get the actual template ID from database
            db = SessionLocal()
            try:
                template = db.query(ViralVideoTemplate).filter(
                    ViralVideoTemplate.title == matches[0]['template']['title']
                ).first()
                if template:
                    best_template_id = template.id
            finally:
                db.close()
            
            if best_template_id:
                reconstruction = viral_matching_service.suggest_video_reconstruction(
                    template_id=best_template_id,
                    property_id=property_id
                )
                
                if reconstruction:
                    print(f"✅ Reconstruction plan created:")
                    print(f"   Total Duration: {reconstruction['total_duration']:.1f}s")
                    print(f"   Timeline has {len(reconstruction['timeline'])} segments")
                    print(f"   Editing Tips: {len(reconstruction['editing_tips'])} tips")
                    print(f"   Viral Elements: {', '.join(reconstruction['viral_elements'])}")
                    
                    print(f"\n🎬 Timeline:")
                    for i, item in enumerate(reconstruction['timeline'], 1):
                        print(f"   {i}. {item['start_time']:.1f}s - {item['end_time']:.1f}s: {item['instructions']}")
                    
                    print(f"\n💡 Editing Tips:")
                    for tip in reconstruction['editing_tips']:
                        print(f"   • {tip}")
                else:
                    print("❌ Could not create reconstruction plan")
        
        return matches
        
    except Exception as e:
        print(f"❌ Error during viral matching: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_template_listing():
    """Test template listing functionality"""
    print(f"\n📋 Testing template listing...")
    print("=" * 40)
    
    try:
        db = SessionLocal()
        templates = db.query(ViralVideoTemplate).filter(
            ViralVideoTemplate.is_active == True
        ).order_by(ViralVideoTemplate.popularity_score.desc()).all()
        
        print(f"✅ Found {len(templates)} active templates:")
        
        for template in templates:
            print(f"\n🎯 {template.title}")
            print(f"   Category: {template.category}")
            print(f"   Platform: {template.source_platform}")
            print(f"   Viral Score: {template.popularity_score}/10")
            print(f"   Duration: {template.total_duration_min:.1f}-{template.total_duration_max:.1f}s")
            print(f"   Segments Required: {len(template.segments_pattern)}")
            print(f"   Tags: {', '.join(template.tags[:5])}")
        
        db.close()
        return templates
        
    except Exception as e:
        print(f"❌ Error listing templates: {e}")
        return []

def main():
    """Main test function"""
    print("🎬 Viral Video Matching System Test")
    print("=" * 50)
    
    # Step 1: Create test data
    property_id = create_test_data()
    if not property_id:
        print("❌ Failed to create test data. Exiting.")
        return
    
    # Step 2: Test template listing
    templates = test_template_listing()
    if not templates:
        print("❌ No templates found. Run generate_viral_templates.py first.")
        return
    
    # Step 3: Test viral matching
    matches = test_viral_matching(property_id)
    
    # Summary
    print(f"\n🎉 Test Summary")
    print("=" * 30)
    print(f"✅ Templates Available: {len(templates)}")
    print(f"✅ Matches Found: {len(matches) if matches else 0}")
    
    if matches:
        creatable = sum(1 for m in matches if m['can_create'])
        print(f"✅ Videos Ready to Create: {creatable}")
        
        if creatable > 0:
            print(f"\n🚀 Ready to implement the frontend interface!")
            print(f"   You can now create viral videos based on these patterns.")
        else:
            print(f"\n📸 Upload more hotel content to improve matching.")
    
    print(f"\n💡 Next steps:")
    print(f"   1. Open http://localhost:3001/admin/viral-matching")
    print(f"   2. Select '{property_id}' as the property")
    print(f"   3. Click 'Find Matches' to see results")
    print(f"   4. Create viral videos from your hotel content!")

if __name__ == "__main__":
    main()