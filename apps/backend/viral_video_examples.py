#!/usr/bin/env python3
"""
Example viral video templates to demonstrate the system.

Run this script to populate your database with viral video patterns.
"""

from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.viral_video_template import ViralVideoTemplate

def create_example_templates():
    """Create example viral video templates"""
    print("🎬 Creating Viral Video Templates\n")
    
    db = SessionLocal()
    
    try:
        # 1. Morning Routine TikTok
        morning_routine = ViralVideoTemplate(
            title="Morning Routine TikTok",
            description="Popular morning routine format: bedroom → bathroom → kitchen sequence",
            category="lifestyle",
            source_platform="tiktok",
            segments_pattern=[
                {
                    "scene_type": "bedroom",
                    "duration_min": 2.0,
                    "duration_max": 5.0,
                    "description_contains": ["bed", "room", "bedroom"],
                    "required": True,
                    "order": 1
                },
                {
                    "scene_type": "bathroom",
                    "duration_min": 3.0,
                    "duration_max": 8.0,
                    "description_contains": ["bathroom", "sink", "mirror"],
                    "required": True,
                    "order": 2
                },
                {
                    "scene_type": "kitchen",
                    "duration_min": 2.0,
                    "duration_max": 6.0,
                    "description_contains": ["kitchen", "coffee", "breakfast"],
                    "required": False,
                    "order": 3
                }
            ],
            total_duration_min=7.0,
            total_duration_max=19.0,
            popularity_score=9.5,
            tags=["morning", "routine", "lifestyle", "daily"]
        )
        
        # 2. Hotel Room Tour
        hotel_tour = ViralVideoTemplate(
            title="Luxury Hotel Room Tour",
            description="Hotel room reveal format: entrance → bedroom → bathroom → amenities",
            category="travel",
            source_platform="instagram",
            segments_pattern=[
                {
                    "scene_type": "general",
                    "duration_min": 1.0,
                    "duration_max": 3.0,
                    "description_contains": ["room", "hotel", "door"],
                    "required": True,
                    "order": 1
                },
                {
                    "scene_type": "bedroom",
                    "duration_min": 3.0,
                    "duration_max": 7.0,
                    "description_contains": ["bed", "bedroom", "view"],
                    "required": True,
                    "order": 2
                },
                {
                    "scene_type": "bathroom",
                    "duration_min": 2.0,
                    "duration_max": 5.0,
                    "description_contains": ["bathroom", "marble", "luxury"],
                    "required": True,
                    "order": 3
                },
                {
                    "scene_type": "pool",
                    "duration_min": 2.0,
                    "duration_max": 4.0,
                    "description_contains": ["pool", "water", "terrace"],
                    "required": False,
                    "order": 4
                }
            ],
            total_duration_min=8.0,
            total_duration_max=19.0,
            popularity_score=8.8,
            tags=["hotel", "luxury", "travel", "tour", "accommodation"]
        )
        
        # 3. Pool Day Vibe
        pool_day = ViralVideoTemplate(
            title="Pool Day Aesthetic",
            description="Relaxing pool content: pool shots → lounge area → sunset/drinks",
            category="lifestyle",
            source_platform="instagram",
            segments_pattern=[
                {
                    "scene_type": "pool",
                    "duration_min": 4.0,
                    "duration_max": 8.0,
                    "description_contains": ["pool", "water", "swimming"],
                    "required": True,
                    "order": 1
                },
                {
                    "scene_type": "outdoor",
                    "duration_min": 2.0,
                    "duration_max": 5.0,
                    "description_contains": ["chairs", "lounge", "terrace"],
                    "required": False,
                    "order": 2
                },
                {
                    "scene_type": "general",
                    "duration_min": 1.0,
                    "duration_max": 3.0,
                    "description_contains": ["sunset", "drinks", "relaxing"],
                    "required": False,
                    "order": 3
                }
            ],
            total_duration_min=5.0,
            total_duration_max=16.0,
            popularity_score=7.2,
            tags=["pool", "summer", "relaxation", "vacation", "aesthetic"]
        )
        
        # 4. Get Ready With Me (GRWM)
        grwm = ViralVideoTemplate(
            title="Get Ready With Me (GRWM)",
            description="Getting ready sequence: bedroom → bathroom → outfit reveal",
            category="lifestyle",
            source_platform="tiktok",
            segments_pattern=[
                {
                    "scene_type": "bedroom",
                    "duration_min": 2.0,
                    "duration_max": 4.0,
                    "description_contains": ["bed", "room", "clothes"],
                    "required": True,
                    "order": 1
                },
                {
                    "scene_type": "bathroom",
                    "duration_min": 4.0,
                    "duration_max": 8.0,
                    "description_contains": ["bathroom", "mirror", "getting ready"],
                    "required": True,
                    "order": 2
                },
                {
                    "scene_type": "general",
                    "duration_min": 1.0,
                    "duration_max": 3.0,
                    "description_contains": ["outfit", "final", "ready"],
                    "required": False,
                    "order": 3
                }
            ],
            total_duration_min=6.0,
            total_duration_max=15.0,
            popularity_score=9.0,
            tags=["grwm", "getting ready", "outfit", "routine", "style"]
        )
        
        # Add all templates to database
        templates = [morning_routine, hotel_tour, pool_day, grwm]
        for template in templates:
            db.add(template)
        
        db.commit()
        
        print(f"✅ Created {len(templates)} viral video templates:")
        for template in templates:
            print(f"   • {template.title} ({template.category}) - {len(template.segments_pattern)} segments")
        
        print(f"\n📊 Templates by category:")
        categories = {}
        for template in templates:
            if template.category not in categories:
                categories[template.category] = []
            categories[template.category].append(template.title)
        
        for category, titles in categories.items():
            print(f"   {category}: {', '.join(titles)}")
        
        print(f"\n🎯 How to use these templates:")
        print(f"   1. The system will analyze your uploaded videos")
        print(f"   2. It will match your content segments to these patterns")
        print(f"   3. When you have matching segments, it can suggest viral video reconstructions")
        print(f"   4. You can customize the order and timing to match viral trends")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating templates: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def show_existing_templates():
    """Show existing viral video templates"""
    print("📋 Existing Viral Video Templates\n")
    
    db = SessionLocal()
    
    try:
        templates = db.query(ViralVideoTemplate).filter(ViralVideoTemplate.is_active == True).all()
        
        if not templates:
            print("❌ No viral video templates found")
            print("   Run create_example_templates() first")
            return
        
        for template in templates:
            print(f"🎬 {template.title}")
            print(f"   Category: {template.category}")
            print(f"   Platform: {template.source_platform}")
            print(f"   Duration: {template.total_duration_min:.1f}s - {template.total_duration_max:.1f}s")
            print(f"   Popularity: {template.popularity_score}/10")
            print(f"   Description: {template.description}")
            print(f"   Pattern:")
            
            for i, segment in enumerate(template.segments_pattern, 1):
                required = "REQUIRED" if segment.get("required", True) else "OPTIONAL"
                print(f"      {i}. {segment['scene_type']} ({segment['duration_min']:.1f}s-{segment['duration_max']:.1f}s) [{required}]")
                if segment.get("description_contains"):
                    print(f"         Must contain: {', '.join(segment['description_contains'])}")
            
            print(f"   Tags: {', '.join(template.tags)}")
            print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "show":
        show_existing_templates()
    else:
        create_example_templates()
        print(f"\n" + "="*50)
        show_existing_templates()