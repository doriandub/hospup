#!/usr/bin/env python3
"""
Script to generate viral video templates from the viral video database.

This script analyzes the JSON scripts from viral videos and creates
reusable templates that can be matched against user content.
"""

import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from pathlib import Path
import sys

# Add parent directory to path to import modules
sys.path.append(str(Path(__file__).parent.parent))

from core.database import SessionLocal, engine
from models.viral_video_template import ViralVideoTemplate, Base

def analyze_viral_script(script_json: str) -> dict:
    """
    Analyze a viral video script and extract patterns
    
    Args:
        script_json: JSON string containing clips and texts
        
    Returns:
        Dictionary with extracted patterns
    """
    try:
        script = json.loads(script_json)
    except json.JSONDecodeError:
        return None
    
    clips = script.get('clips', [])
    texts = script.get('texts', [])
    
    if not clips:
        return None
    
    # Analyze clip patterns
    segments_pattern = []
    total_duration = 0
    
    for clip in clips:
        duration = clip.get('duration', 0)
        description = clip.get('description', '')
        
        # Extract scene type from description
        scene_type = extract_scene_type(description)
        
        # Extract keywords that make it viral
        viral_keywords = extract_viral_keywords(description)
        
        segments_pattern.append({
            "scene_type": scene_type,
            "duration_min": max(1.0, duration * 0.8),  # 20% flexibility
            "duration_max": duration * 1.2,
            "description_contains": viral_keywords,
            "required": True,
            "viral_elements": extract_viral_elements(description)
        })
        
        total_duration += duration
    
    # Analyze text overlays for viral elements
    text_elements = []
    for text in texts:
        content = text.get('content', '')
        if content:
            text_elements.append({
                "content": content,
                "timing": {
                    "start": text.get('start', 0),
                    "end": text.get('end', 0)
                },
                "style": {
                    "position": text.get('anchor', 'top_center'),
                    "font_family": text.get('font_family', 'Poppins'),
                    "size_rel": text.get('size_rel', 0.035)
                }
            })
    
    return {
        "segments_pattern": segments_pattern,
        "total_duration": total_duration,
        "text_elements": text_elements,
        "viral_score": calculate_viral_score(clips, texts)
    }

def extract_scene_type(description: str) -> str:
    """Extract scene type from description"""
    description_lower = description.lower()
    
    # Scene type mapping
    scene_types = {
        "airplane": ["airplane", "plane", "flight", "window", "clouds"],
        "hotel_room": ["room", "bedroom", "bed", "hotel"],
        "bathroom": ["bathroom", "shower", "bath", "mirror"],
        "restaurant": ["restaurant", "dining", "food", "eating"],
        "lobby": ["lobby", "reception", "entrance", "check"],
        "pool": ["pool", "swimming", "water", "deck"],
        "spa": ["spa", "massage", "wellness", "relaxation"],
        "balcony": ["balcony", "terrace", "view", "outside"],
        "general": []  # fallback
    }
    
    for scene_type, keywords in scene_types.items():
        if any(keyword in description_lower for keyword in keywords):
            return scene_type
    
    return "general"

def extract_viral_keywords(description: str) -> list:
    """Extract keywords that make content viral"""
    description_lower = description.lower()
    
    viral_keywords = []
    viral_terms = {
        "luxury": ["luxury", "elegant", "premium", "high-end"],
        "aesthetic": ["aesthetic", "beautiful", "stunning", "gorgeous"],
        "surreal": ["surreal", "magical", "cinematic", "dreamy"],
        "exclusive": ["exclusive", "private", "vip", "special"],
        "lifestyle": ["lifestyle", "living", "experience", "journey"]
    }
    
    for category, terms in viral_terms.items():
        if any(term in description_lower for term in terms):
            viral_keywords.extend([t for t in terms if t in description_lower])
    
    return list(set(viral_keywords))  # Remove duplicates

def extract_viral_elements(description: str) -> list:
    """Extract what makes this clip viral"""
    elements = []
    description_lower = description.lower()
    
    if any(word in description_lower for word in ["cinematic", "wide shot", "high angle"]):
        elements.append("cinematic_shots")
    
    if any(word in description_lower for word in ["surreal", "magical", "dreamy"]):
        elements.append("surreal_content")
    
    if any(word in description_lower for word in ["luxury", "premium", "elegant"]):
        elements.append("luxury_appeal")
    
    if any(word in description_lower for word in ["daytime", "morning", "sunset"]):
        elements.append("time_specific")
    
    return elements

def calculate_viral_score(clips: list, texts: list) -> float:
    """Calculate viral potential score (0-10)"""
    score = 5.0  # Base score
    
    # Duration optimization (viral videos are typically 10-30s)
    total_duration = sum(clip.get('duration', 0) for clip in clips)
    if 10 <= total_duration <= 30:
        score += 1.0
    elif total_duration < 10:
        score -= 0.5
    elif total_duration > 60:
        score -= 1.0
    
    # Multiple clips (quick cuts are viral)
    if len(clips) >= 3:
        score += 1.0
    
    # Text overlays (important for engagement)
    if len(texts) > 0:
        score += 0.5
    
    # Cinematic elements
    for clip in clips:
        desc = clip.get('description', '').lower()
        if any(word in desc for word in ["cinematic", "surreal", "aesthetic"]):
            score += 0.5
    
    return min(10.0, max(0.0, score))

def create_viral_templates():
    """
    Create viral video templates from sample data
    
    In a real implementation, this would read from your viral video database.
    For now, we'll create templates based on common viral patterns.
    """
    
    # Sample viral video data - replace with your actual data
    viral_videos = [
        {
            "title": "Luxury Hotel Airplane View",
            "description": "Surreal airplane window view with figures on clouds - viral travel content",
            "category": "travel",
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
                        "content": "DEPUIS SON HUBLOT, ELLE FILME UNE SCÈNE\nSURRÉALISTE DANS LES NUAGES… 🫙",
                        "start": 0.00,
                        "end": 3.80,
                        "anchor": "top_center",
                        "font_family": "Poppins",
                        "size_rel": 0.035
                    }
                ]
            },
            "tags": ["travel", "surreal", "airplane", "viral", "cinematic"],
            "popularity_score": 9.2
        },
        # Add more templates for different viral patterns
        {
            "title": "Hotel Morning Routine",
            "description": "Luxury hotel morning routine - lifestyle viral content",
            "category": "lifestyle",
            "source_platform": "tiktok",
            "script": {
                "clips": [
                    {
                        "order": 1,
                        "duration": 3.0,
                        "description": "Hotel bedroom morning, luxury bed, natural lighting, aesthetic"
                    },
                    {
                        "order": 2,
                        "duration": 4.0,
                        "description": "Bathroom getting ready, mirror shot, luxury amenities"
                    },
                    {
                        "order": 3,
                        "duration": 3.0,
                        "description": "Hotel breakfast, room service, luxury food presentation"
                    }
                ],
                "texts": [
                    {
                        "content": "MORNING ROUTINE IN A 5⭐ HOTEL",
                        "start": 0.0,
                        "end": 3.0,
                        "anchor": "top_center"
                    }
                ]
            },
            "tags": ["lifestyle", "routine", "luxury", "morning", "hotel"],
            "popularity_score": 8.5
        },
        {
            "title": "Hotel Room Tour",
            "description": "Quick luxury hotel room showcase - viral hospitality content",
            "category": "hospitality",
            "source_platform": "instagram",
            "script": {
                "clips": [
                    {
                        "order": 1,
                        "duration": 2.5,
                        "description": "Hotel room entrance, first impression, luxury interior"
                    },
                    {
                        "order": 2,
                        "duration": 3.0,
                        "description": "Bedroom area, luxury bed, room amenities showcase"
                    },
                    {
                        "order": 3,
                        "duration": 2.5,
                        "description": "Bathroom luxury features, high-end amenities"
                    },
                    {
                        "order": 4,
                        "duration": 2.0,
                        "description": "Balcony or window view, destination showcase"
                    }
                ],
                "texts": [
                    {
                        "content": "THIS HOTEL ROOM IS INSANE 🤯",
                        "start": 0.0,
                        "end": 2.5,
                        "anchor": "top_center"
                    }
                ]
            },
            "tags": ["hospitality", "room_tour", "luxury", "showcase", "viral"],
            "popularity_score": 8.8
        }
    ]
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Clear existing templates (optional)
        # db.query(ViralVideoTemplate).delete()
        
        created_templates = []
        
        for video_data in viral_videos:
            # Analyze the script to extract patterns
            pattern_analysis = analyze_viral_script(json.dumps(video_data["script"]))
            
            if not pattern_analysis:
                print(f"⚠️  Could not analyze script for {video_data['title']}")
                continue
            
            # Create template
            template = ViralVideoTemplate(
                id=str(uuid.uuid4()),
                title=video_data["title"],
                description=video_data["description"],
                category=video_data["category"],
                source_platform=video_data["source_platform"],
                segments_pattern=pattern_analysis["segments_pattern"],
                total_duration_min=max(8.0, pattern_analysis["total_duration"] * 0.8),
                total_duration_max=min(30.0, pattern_analysis["total_duration"] * 1.2),
                popularity_score=video_data["popularity_score"],
                tags=video_data["tags"],
                is_active=True
            )
            
            # Check if template already exists
            existing = db.query(ViralVideoTemplate).filter(
                ViralVideoTemplate.title == template.title
            ).first()
            
            if existing:
                print(f"📝 Updating existing template: {template.title}")
                existing.segments_pattern = template.segments_pattern
                existing.total_duration_min = template.total_duration_min
                existing.total_duration_max = template.total_duration_max
                existing.popularity_score = template.popularity_score
                existing.tags = template.tags
                existing.updated_at = datetime.now()
            else:
                print(f"➕ Creating new template: {template.title}")
                db.add(template)
                created_templates.append(template)
        
        # Commit changes
        db.commit()
        
        print(f"\n✅ Successfully processed {len(viral_videos)} viral video templates!")
        print(f"📊 Created {len(created_templates)} new templates")
        
        # Display template details
        for template in created_templates:
            print(f"\n🎯 Template: {template.title}")
            print(f"   Category: {template.category}")
            print(f"   Duration: {template.total_duration_min:.1f}-{template.total_duration_max:.1f}s")
            print(f"   Segments: {len(template.segments_pattern)}")
            print(f"   Viral Score: {template.popularity_score}/10")
            print(f"   Tags: {', '.join(template.tags)}")
        
        return created_templates
        
    except Exception as e:
        print(f"❌ Error creating templates: {e}")
        db.rollback()
        return []
    finally:
        db.close()

if __name__ == "__main__":
    print("🎬 Generating Viral Video Templates...")
    print("=" * 50)
    
    templates = create_viral_templates()
    
    if templates:
        print("\n🎉 Templates created successfully!")
        print("\nNext steps:")
        print("1. Test the viral matching service")
        print("2. Create the reconstruction interface")
        print("3. Upload your hotel videos to test matching")
    else:
        print("\n❌ No templates were created")