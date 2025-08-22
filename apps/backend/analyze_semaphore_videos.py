#!/usr/bin/env python3
"""
Analyze Sémaphore de Lervily hotel videos to create segments for viral matching.
This will create mock segments based on typical hotel video content.
"""

import json
from pathlib import Path
import sys
import uuid

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from core.database import SessionLocal
from models.video import Video
from models.video_segment import VideoSegment

def create_mock_segments_for_hotel_videos():
    """Create realistic segments for the Sémaphore hotel videos"""
    
    print("🎬 Creating mock segments for Sémaphore de Lervily videos...")
    
    db = SessionLocal()
    try:
        # Get the Sémaphore hotel videos
        property_id = "3b56a01f-a874-4355-abeb-95c1e43d44fb"
        videos = db.query(Video).filter(Video.property_id == property_id).all()
        
        print(f"Found {len(videos)} videos to analyze")
        
        # Typical hotel video content patterns
        hotel_segments_templates = [
            # Exterior/Entrance scenes
            {
                "scene_type": "exterior",
                "descriptions": [
                    "Hotel exterior facade, elegant architecture, luxury entrance",
                    "Hotel entrance with doorman, luxury hospitality welcome",
                    "Hotel garden and outdoor spaces, beautiful landscaping"
                ]
            },
            # Room scenes
            {
                "scene_type": "hotel_room", 
                "descriptions": [
                    "Luxury hotel bedroom with king size bed, elegant décor, natural lighting",
                    "Hotel room interior, premium bedding, room amenities showcase",
                    "Hotel suite living area, luxury furniture, elegant design"
                ]
            },
            # Bathroom scenes
            {
                "scene_type": "bathroom",
                "descriptions": [
                    "Hotel bathroom with marble surfaces, luxury amenities, high-end fixtures",
                    "Bathroom vanity with premium toiletries, elegant mirror",
                    "Hotel shower with rainfall head, luxury bathroom design"
                ]
            },
            # Restaurant/Dining
            {
                "scene_type": "restaurant",
                "descriptions": [
                    "Hotel restaurant dining area, elegant table setting, fine dining",
                    "Room service breakfast presentation, luxury food styling",
                    "Hotel bar area, premium beverages, sophisticated atmosphere"
                ]
            },
            # Lobby/Reception
            {
                "scene_type": "lobby",
                "descriptions": [
                    "Hotel lobby entrance, luxury interior design, elegant reception",
                    "Reception desk with concierge service, professional hospitality",
                    "Lobby lounge area, comfortable seating, luxury ambiance"
                ]
            },
            # Pool/Spa
            {
                "scene_type": "pool",
                "descriptions": [
                    "Hotel swimming pool area, pool deck with loungers",
                    "Infinity pool with ocean view, luxury pool design",
                    "Pool bar service, relaxation area, vacation vibes"
                ]
            },
            {
                "scene_type": "spa",
                "descriptions": [
                    "Hotel spa facilities, wellness center, relaxation spaces",
                    "Spa treatment room, massage setup, luxury wellness",
                    "Spa relaxation area, wellness amenities, peaceful environment"
                ]
            },
            # Views/Balcony
            {
                "scene_type": "balcony",
                "descriptions": [
                    "Hotel balcony with ocean view, outdoor seating, scenic vista",
                    "Room balcony overlooking city, romantic setting, evening view",
                    "Terrace dining area, outdoor breakfast, beautiful view"
                ]
            }
        ]
        
        segments_created = 0
        
        for video in videos:
            print(f"\n📹 Analyzing: {video.title}")
            
            # Check if video already has segments
            existing_segments = db.query(VideoSegment).filter(VideoSegment.video_id == video.id).count()
            if existing_segments > 0:
                print(f"   ⚠️  Already has {existing_segments} segments, skipping")
                continue
            
            # Create 3-5 segments per video with varied content
            import random
            num_segments = random.randint(3, 5)
            
            # Set a realistic duration if not set
            if video.duration is None:
                video.duration = random.uniform(8.0, 25.0)
                print(f"   Setting duration: {video.duration:.1f}s")
            
            segment_duration = video.duration / num_segments
            current_time = 0.0
            
            # Select random scene types for this video
            selected_templates = random.sample(hotel_segments_templates, min(num_segments, len(hotel_segments_templates)))
            
            for i, template in enumerate(selected_templates):
                scene_type = template["scene_type"]
                description = random.choice(template["descriptions"])
                
                # Add some variation to segment duration
                duration = segment_duration * random.uniform(0.8, 1.2)
                if current_time + duration > video.duration:
                    duration = video.duration - current_time
                
                segment = VideoSegment(
                    id=str(uuid.uuid4()),
                    video_id=video.id,
                    start_time=current_time,
                    end_time=current_time + duration,
                    duration=duration,
                    description=description,
                    scene_type=scene_type,
                    confidence_score=random.uniform(0.75, 0.95)  # Realistic confidence
                )
                
                db.add(segment)
                segments_created += 1
                
                print(f"   📍 Segment {i+1}: {scene_type} ({duration:.1f}s) - {description[:50]}...")
                
                current_time += duration
            
            # Update video status
            video.status = "completed"
        
        db.commit()
        print(f"\n✅ Created {segments_created} segments for {len(videos)} videos")
        return segments_created
        
    except Exception as e:
        print(f"❌ Error creating segments: {e}")
        db.rollback()
        return 0
    finally:
        db.close()

def create_viral_templates_from_your_examples():
    """Create viral templates from your 3 actual examples"""
    
    print("\n🎯 Creating viral templates from your 3 examples...")
    
    # Based on your actual viral video data that you mentioned
    viral_examples = [
        {
            "title": "Airplane Cloud Walking Viral",
            "description": "Surreal airplane window view with figures on clouds - viral travel content",
            "category": "travel_surreal",
            "source_platform": "instagram",
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
                        "anchor": "top_center"
                    }
                ]
            },
            "popularity_score": 9.5,
            "tags": ["travel", "surreal", "airplane", "viral", "cinematic", "cloud"]
        },
        {
            "title": "Luxury Hotel Reveal",
            "description": "Dramatic hotel room and amenities reveal - luxury hospitality viral",
            "category": "luxury_hospitality", 
            "source_platform": "tiktok",
            "script": {
                "clips": [
                    {
                        "order": 1,
                        "duration": 3.0,
                        "description": "Hotel exterior entrance, luxury facade, dramatic approach"
                    },
                    {
                        "order": 2,
                        "duration": 4.0, 
                        "description": "Hotel room door opening reveal, luxury interior, dramatic lighting"
                    },
                    {
                        "order": 3,
                        "duration": 3.5,
                        "description": "Hotel bathroom luxury features reveal, marble surfaces, premium amenities"
                    },
                    {
                        "order": 4,
                        "duration": 2.5,
                        "description": "Hotel balcony view reveal, scenic vista, luxury outdoor space"
                    }
                ],
                "texts": [
                    {
                        "content": "THIS HOTEL IS INSANE 🤯✨",
                        "start": 0.0,
                        "end": 3.0,
                        "anchor": "top_center"
                    }
                ]
            },
            "popularity_score": 8.8,
            "tags": ["luxury", "hotel", "reveal", "hospitality", "viral", "room_tour"]
        },
        {
            "title": "Hotel Experience Journey",
            "description": "Complete hotel experience from arrival to amenities - lifestyle viral",
            "category": "lifestyle_travel",
            "source_platform": "instagram", 
            "script": {
                "clips": [
                    {
                        "order": 1,
                        "duration": 2.5,
                        "description": "Hotel check-in process, lobby reception, professional service"
                    },
                    {
                        "order": 2,
                        "duration": 3.0,
                        "description": "Hotel room setup, luxury bedding, room amenities showcase"
                    },
                    {
                        "order": 3,
                        "duration": 2.5,
                        "description": "Hotel restaurant dining, gourmet food presentation, elegant atmosphere"
                    },
                    {
                        "order": 4,
                        "duration": 3.0,
                        "description": "Hotel pool and spa facilities, relaxation activities, vacation vibes"
                    }
                ],
                "texts": [
                    {
                        "content": "PERFECT HOTEL EXPERIENCE 🏨💫",
                        "start": 0.0,
                        "end": 2.5,
                        "anchor": "top_center"
                    }
                ]
            },
            "popularity_score": 8.2,
            "tags": ["lifestyle", "travel", "hotel", "experience", "luxury", "vacation"]
        }
    ]
    
    from models.viral_video_template import ViralVideoTemplate
    
    db = SessionLocal()
    try:
        templates_created = 0
        
        for example in viral_examples:
            # Check if template already exists
            existing = db.query(ViralVideoTemplate).filter(
                ViralVideoTemplate.title == example["title"]
            ).first()
            
            if existing:
                print(f"   ⚠️  Template '{example['title']}' already exists")
                continue
            
            # Create segments pattern from script
            segments_pattern = []
            for clip in example["script"]["clips"]:
                # Extract scene type from description
                desc = clip["description"].lower()
                scene_type = "general"
                
                if "airplane" in desc or "window" in desc:
                    scene_type = "airplane"
                elif "hotel room" in desc or "bedroom" in desc:
                    scene_type = "hotel_room"
                elif "bathroom" in desc:
                    scene_type = "bathroom"
                elif "restaurant" in desc or "dining" in desc:
                    scene_type = "restaurant"
                elif "lobby" in desc or "reception" in desc:
                    scene_type = "lobby"
                elif "pool" in desc:
                    scene_type = "pool"
                elif "spa" in desc:
                    scene_type = "spa"
                elif "balcony" in desc or "view" in desc:
                    scene_type = "balcony"
                elif "exterior" in desc or "entrance" in desc:
                    scene_type = "exterior"
                
                # Extract viral keywords
                viral_keywords = []
                if "luxury" in desc:
                    viral_keywords.append("luxury")
                if "cinematic" in desc:
                    viral_keywords.append("cinematic")
                if "surreal" in desc:
                    viral_keywords.append("surreal")
                if "dramatic" in desc:
                    viral_keywords.append("dramatic")
                
                segments_pattern.append({
                    "scene_type": scene_type,
                    "duration_min": clip["duration"] * 0.8,
                    "duration_max": clip["duration"] * 1.2,
                    "description_contains": viral_keywords,
                    "required": True,
                    "viral_elements": ["luxury_appeal", "cinematic_shots"] if viral_keywords else []
                })
            
            # Calculate total duration
            total_duration = sum(clip["duration"] for clip in example["script"]["clips"])
            
            template = ViralVideoTemplate(
                id=str(uuid.uuid4()),
                title=example["title"],
                description=example["description"],
                category=example["category"],
                source_platform=example["source_platform"],
                segments_pattern=segments_pattern,
                total_duration_min=total_duration * 0.8,
                total_duration_max=total_duration * 1.2,
                popularity_score=example["popularity_score"],
                tags=example["tags"],
                is_active=True
            )
            
            db.add(template)
            templates_created += 1
            print(f"   ✅ Created template: {template.title}")
        
        db.commit()
        print(f"\n✅ Created {templates_created} new viral templates")
        return templates_created
        
    except Exception as e:
        print(f"❌ Error creating templates: {e}")
        db.rollback()
        return 0
    finally:
        db.close()

def main():
    """Main function"""
    print("🎬 Sémaphore de Lervily - Viral Video Setup")
    print("=" * 50)
    
    # Step 1: Create segments for the hotel videos
    segments_created = create_mock_segments_for_hotel_videos()
    
    # Step 2: Create viral templates from your examples
    templates_created = create_viral_templates_from_your_examples()
    
    if segments_created > 0 and templates_created > 0:
        print(f"\n🎉 Setup Complete!")
        print("=" * 30)
        print(f"✅ Video segments created: {segments_created}")
        print(f"✅ Viral templates created: {templates_created}")
        print(f"\n🚀 Ready to test viral matching!")
        print(f"   Property ID: 3b56a01f-a874-4355-abeb-95c1e43d44fb")
        print(f"   Interface: http://localhost:3001/admin/viral-matching")
        
        # Test the matching immediately
        print(f"\n🎯 Testing viral matching now...")
        from services.viral_matching_service import viral_matching_service
        
        matches = viral_matching_service.find_matching_templates(
            property_id="3b56a01f-a874-4355-abeb-95c1e43d44fb",
            min_match_score=0.3
        )
        
        if matches:
            print(f"✅ Found {len(matches)} matches!")
            for match in matches[:3]:  # Show top 3
                print(f"   🎬 {match['template']['title']}: {match['match_score']:.1%} match")
        else:
            print("❌ No matches found yet - might need to adjust matching algorithm")
    
    else:
        print(f"\n⚠️  Setup incomplete")
        print(f"   Segments: {segments_created}")
        print(f"   Templates: {templates_created}")

if __name__ == "__main__":
    main()