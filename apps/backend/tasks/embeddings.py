from celery import current_task
from core.celery_app import celery_app
# Lazy import to avoid connection issues at startup
import openai
from core.config import settings
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

# Set OpenAI API key
openai.api_key = settings.OPENAI_API_KEY

@celery_app.task(bind=True)
def populate_viral_video_database(self) -> Dict[str, Any]:
    """
    Populate the Weaviate database with sample viral video data
    This would normally pull from a real viral video database or API
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "setting_up_schema", "progress": 10}
        )
        
        # Setup Weaviate schema
        from core.weaviate import weaviate_client
        schema_success = weaviate_client.setup_schema()
        if not schema_success:
            raise Exception("Failed to setup Weaviate schema")
        
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "adding_sample_data", "progress": 30}
        )
        
        # Sample viral video data
        sample_videos = [
            {
                "title": "Luxury Hotel Room Tour That Will Blow Your Mind",
                "description": "Stunning luxury hotel suite with incredible city views, marble bathroom, and premium amenities. Perfect for romantic getaways and special occasions.",
                "thumbnailUrl": "https://example.com/luxury-hotel-thumb.jpg",
                "originalUrl": "https://tiktok.com/@hotel/video1",
                "tags": ["luxury", "hotel", "room tour", "travel", "vacation"],
                "style": "smooth transitions, dramatic lighting",
                "music": "trending ambient music",
                "createdAt": "2024-01-15T10:00:00Z"
            },
            {
                "title": "Hidden Airbnb Gem in Paris You Need to See",
                "description": "Charming Parisian apartment with exposed beams, vintage decor, and perfect location near Eiffel Tower. Cozy yet elegant space.",
                "thumbnailUrl": "https://example.com/paris-airbnb-thumb.jpg", 
                "originalUrl": "https://tiktok.com/@travel/video2",
                "tags": ["airbnb", "paris", "apartment", "travel", "hidden gem"],
                "style": "warm lighting, cozy atmosphere",
                "music": "french cafe music",
                "createdAt": "2024-01-20T14:30:00Z"
            },
            {
                "title": "Restaurant Kitchen Secrets You Won't Believe",
                "description": "Behind the scenes look at a michelin-starred restaurant kitchen showing incredible plating techniques and premium ingredients.",
                "thumbnailUrl": "https://example.com/restaurant-kitchen-thumb.jpg",
                "originalUrl": "https://tiktok.com/@chef/video3", 
                "tags": ["restaurant", "kitchen", "cooking", "michelin", "chef"],
                "style": "fast paced, close-up shots",
                "music": "upbeat cooking music",
                "createdAt": "2024-01-25T16:45:00Z"
            },
            {
                "title": "Beach Villa Vacation Rental Paradise",
                "description": "Stunning beachfront villa with infinity pool, private beach access, and panoramic ocean views. Ultimate vacation destination.",
                "thumbnailUrl": "https://example.com/beach-villa-thumb.jpg",
                "originalUrl": "https://tiktok.com/@vacation/video4",
                "tags": ["vacation rental", "beach", "villa", "ocean view", "luxury"],
                "style": "aerial shots, sunset lighting",
                "music": "tropical relaxing music",
                "createdAt": "2024-02-01T09:15:00Z"
            },
            {
                "title": "Cozy Mountain Cabin Perfect for Winter Getaway",
                "description": "Rustic mountain cabin with fireplace, hot tub, and snow-covered forest views. Ideal for romantic winter retreats.",
                "thumbnailUrl": "https://example.com/mountain-cabin-thumb.jpg",
                "originalUrl": "https://tiktok.com/@cabin/video5",
                "tags": ["cabin", "mountain", "winter", "cozy", "fireplace"],
                "style": "warm tones, intimate lighting",
                "music": "acoustic folk music",
                "createdAt": "2024-02-05T11:20:00Z"
            }
        ]
        
        # Add viral videos to Weaviate
        added_videos = []
        for i, video_data in enumerate(sample_videos):
            from core.weaviate import weaviate_client
            video_id = weaviate_client.add_viral_video(video_data)
            if video_id:
                added_videos.append(video_id)
                
                # Add sample scenes for each video
                scenes = generate_sample_scenes(video_id, video_data)
                for scene_data in scenes:
                    from core.weaviate import weaviate_client
                    weaviate_client.add_video_scene(scene_data)
            
            progress = 30 + (i + 1) * 10
            current_task.update_state(
                state="PROGRESS",
                meta={"stage": f"added_video_{i+1}", "progress": progress}
            )
        
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "completed", "progress": 100}
        )
        
        return {
            "success": True,
            "videos_added": len(added_videos),
            "video_ids": added_videos
        }
        
    except Exception as e:
        logger.error(f"Error populating viral video database: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise

def generate_sample_scenes(viral_video_id: str, video_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Generate sample video scenes for a viral video
    """
    scenes = []
    
    if "hotel" in video_data["tags"]:
        scenes = [
            {
                "viralVideoId": viral_video_id,
                "startTime": 0,
                "endTime": 5,
                "description": "Hotel exterior and entrance establishing shot",
                "tags": ["exterior", "entrance", "establishing"]
            },
            {
                "viralVideoId": viral_video_id,
                "startTime": 5,
                "endTime": 15,
                "description": "Room reveal with dramatic lighting and luxury amenities",
                "tags": ["room reveal", "luxury", "amenities", "dramatic"]
            },
            {
                "viralVideoId": viral_video_id,
                "startTime": 15,
                "endTime": 25,
                "description": "Bathroom and view showcase with smooth camera movements",
                "tags": ["bathroom", "view", "smooth transitions"]
            }
        ]
    elif "restaurant" in video_data["tags"]:
        scenes = [
            {
                "viralVideoId": viral_video_id,
                "startTime": 0,
                "endTime": 8,
                "description": "Kitchen prep and ingredient showcase with fast cuts",
                "tags": ["kitchen prep", "ingredients", "fast cuts"]
            },
            {
                "viralVideoId": viral_video_id,
                "startTime": 8,
                "endTime": 20,
                "description": "Cooking process and plating techniques close-ups",
                "tags": ["cooking", "plating", "close-ups", "techniques"]
            },
            {
                "viralVideoId": viral_video_id,
                "startTime": 20,
                "endTime": 30,
                "description": "Final dish presentation and restaurant atmosphere",
                "tags": ["final dish", "presentation", "atmosphere"]
            }
        ]
    else:
        # Generic scenes for other property types
        scenes = [
            {
                "viralVideoId": viral_video_id,
                "startTime": 0,
                "endTime": 10,
                "description": "Property exterior and approach with engaging hook",
                "tags": ["exterior", "approach", "hook"]
            },
            {
                "viralVideoId": viral_video_id,
                "startTime": 10,
                "endTime": 25,
                "description": "Interior features and unique selling points showcase",
                "tags": ["interior", "features", "selling points"]
            },
            {
                "viralVideoId": viral_video_id,
                "startTime": 25,
                "endTime": 30,
                "description": "Call to action and contact information",
                "tags": ["call to action", "contact", "booking"]
            }
        ]
    
    return scenes

@celery_app.task(bind=True)
def update_video_embeddings(self, video_id: str, new_description: str) -> Dict[str, Any]:
    """
    Update embeddings for a specific video in Weaviate
    """
    try:
        # This would update the embeddings in Weaviate
        # For now, just return success
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "updating_embeddings", "progress": 50}
        )
        
        # Simulate embedding update
        import time
        time.sleep(2)
        
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "completed", "progress": 100}
        )
        
        return {
            "success": True,
            "video_id": video_id,
            "updated_description": new_description
        }
        
    except Exception as e:
        logger.error(f"Error updating video embeddings: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise