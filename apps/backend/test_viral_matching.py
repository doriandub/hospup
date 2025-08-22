#!/usr/bin/env python3
"""
Test the viral video matching system.

This script demonstrates how the system matches user content to viral patterns.
"""

from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.video import Video
from models.video_segment import VideoSegment
from models.viral_video_template import ViralVideoTemplate
from services.viral_matching_service import viral_matching_service

def test_viral_matching():
    """Test viral video matching with existing content"""
    print("🎯 Testing Viral Video Matching System\n")
    
    db = SessionLocal()
    
    try:
        # Check if we have analyzed segments
        segments_count = db.query(VideoSegment).count()
        if segments_count == 0:
            print("❌ No analyzed video segments found")
            print("   Run test_simple_analysis.py first to create some segments")
            return False
        
        # Check if we have viral templates
        templates_count = db.query(ViralVideoTemplate).filter(ViralVideoTemplate.is_active == True).count()
        if templates_count == 0:
            print("❌ No viral templates found")
            print("   Run viral_video_examples.py first to create templates")
            return False
        
        print(f"📊 Found {segments_count} analyzed segments and {templates_count} viral templates")
        
        # Get a property with analyzed content
        property_with_content = db.query(Video).join(VideoSegment).first()
        if not property_with_content:
            print("❌ No properties with analyzed content found")
            return False
        
        property_id = property_with_content.property_id
        print(f"🏨 Testing with property: {property_id}")
        
        # Find matching templates
        print(f"\n🔍 Searching for viral video matches...")
        matches = viral_matching_service.find_matching_templates(property_id)
        
        if not matches:
            print("❌ No matching viral templates found")
            print("   This might mean your content doesn't match any viral patterns yet")
            print("   Try uploading more diverse content (bedroom, bathroom, kitchen scenes)")
            return False
        
        print(f"✅ Found {len(matches)} matching viral templates!\n")
        
        # Show matches
        for i, match in enumerate(matches, 1):
            template = match["template"]
            print(f"🎬 Match #{i}: {template['title']}")
            print(f"   Category: {template['category']}")
            print(f"   Match Score: {match['match_score']:.1%}")
            print(f"   Can Create: {'✅ YES' if match['can_create'] else '❌ NO'}")
            print(f"   Suggested Duration: {match['suggested_duration']:.1f}s")
            print(f"   Matched Segments: {len(match['matched_segments'])}")
            print(f"   Missing Segments: {len(match['missing_segments'])}")
            print(f"   Description: {template['description']}")
            print(f"   Popularity: {template['popularity_score']}/10")
            print()
        
        # Test reconstruction for best match
        best_match = matches[0]
        if best_match["can_create"]:
            print(f"🛠️  Creating reconstruction plan for: {best_match['template']['title']}")
            
            reconstruction = viral_matching_service.suggest_video_reconstruction(
                template_id=best_match["template"]["id"],
                property_id=property_id
            )
            
            if reconstruction:
                print(f"✅ Reconstruction plan created!")
                print(f"\n📋 Timeline ({reconstruction['total_duration']:.1f}s total):")
                
                for i, item in enumerate(reconstruction["timeline"], 1):
                    segment = item["source_segment"]
                    print(f"   {i}. {item['start_time']:.1f}s-{item['end_time']:.1f}s: {segment['scene_type']}")
                    print(f"      Source: \"{segment['description']}\"")
                    print(f"      Instructions: {item['instructions']}")
                
                print(f"\n💡 Editing Tips:")
                for tip in reconstruction["editing_tips"]:
                    print(f"   • {tip}")
                
                print(f"\n🔥 Viral Elements:")
                for element in reconstruction["viral_elements"]:
                    print(f"   • {element}")
            else:
                print("❌ Could not create reconstruction plan")
        
        print(f"\n" + "="*60)
        print(f"🎉 Viral matching test completed successfully!")
        print(f"\n📝 What this means:")
        print(f"   • Your content can be automatically matched to viral patterns")
        print(f"   • The system suggests which viral videos you can recreate")
        print(f"   • You get detailed timelines and editing instructions")
        print(f"   • Perfect for creating engaging content that follows viral trends!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def show_viral_stats():
    """Show statistics about the viral matching system"""
    print("📊 Viral Matching System Statistics\n")
    
    db = SessionLocal()
    
    try:
        # Template stats
        templates = db.query(ViralVideoTemplate).filter(ViralVideoTemplate.is_active == True).all()
        print(f"🎬 Viral Templates: {len(templates)}")
        
        categories = {}
        platforms = {}
        for template in templates:
            categories[template.category] = categories.get(template.category, 0) + 1
            platforms[template.source_platform] = platforms.get(template.source_platform, 0) + 1
        
        print(f"   By Category: {', '.join(f'{k}: {v}' for k, v in categories.items())}")
        print(f"   By Platform: {', '.join(f'{k}: {v}' for k, v in platforms.items())}")
        
        # Segment stats
        segments = db.query(VideoSegment).all()
        print(f"\n📹 Analyzed Segments: {len(segments)}")
        
        scene_types = {}
        for segment in segments:
            scene_type = segment.scene_type or "unknown"
            scene_types[scene_type] = scene_types.get(scene_type, 0) + 1
        
        print(f"   By Scene Type: {', '.join(f'{k}: {v}' for k, v in scene_types.items())}")
        
        # Properties with content
        properties_with_content = db.query(Video.property_id).join(VideoSegment).distinct().count()
        print(f"\n🏨 Properties with Analyzed Content: {properties_with_content}")
        
    except Exception as e:
        print(f"❌ Error getting stats: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "stats":
        show_viral_stats()
    else:
        print("🚀 Viral Video Matching Test\n")
        show_viral_stats()
        print("\n" + "="*60 + "\n")
        test_viral_matching()