from celery import current_task
from core.celery_app import celery_app
# Lazy import to avoid connection issues at startup
from core.database import get_db
from models.video import Video
from models.property import Property
from models.user import User
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import logging
import openai
from core.config import settings

logger = logging.getLogger(__name__)

# Set OpenAI API key
openai.api_key = settings.OPENAI_API_KEY

@celery_app.task(bind=True)
def find_matching_viral_videos(self, input_data: str, input_type: str, property_id: str, limit: int = 10) -> Dict[str, Any]:
    """
    Find viral videos that match the input (photo description or text)
    """
    try:
        # Update task progress
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "searching", "progress": 10}
        )
        
        # Search for similar viral videos
        if input_type == "text":
            search_query = input_data
        elif input_type == "photo":
            # For photo, we assume input_data is a description generated from the image
            search_query = f"Visual content showing: {input_data}"
        else:
            raise ValueError(f"Unsupported input type: {input_type}")
        
        current_task.update_state(
            state="PROGRESS", 
            meta={"stage": "matching", "progress": 40}
        )
        
        # Search in Weaviate
        from core.weaviate import weaviate_client
        matching_videos = weaviate_client.search_similar_videos(
            query=search_query,
            limit=limit
        )
        
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "processing_results", "progress": 70}
        )
        
        # Also search for matching scenes
        from core.weaviate import weaviate_client
        matching_scenes = weaviate_client.search_similar_scenes(
            query=search_query,
            limit=limit * 2
        )
        
        # Group scenes by viral video ID
        scenes_by_video = {}
        for scene in matching_scenes:
            video_id = scene["properties"].get("viralVideoId")
            if video_id:
                if video_id not in scenes_by_video:
                    scenes_by_video[video_id] = []
                scenes_by_video[video_id].append(scene)
        
        # Combine results
        results = []
        for video in matching_videos:
            video_id = video["id"]
            video_scenes = scenes_by_video.get(video_id, [])
            
            result = {
                "viral_video": {
                    "id": video_id,
                    "title": video["properties"].get("title", ""),
                    "description": video["properties"].get("description", ""),
                    "thumbnail_url": video["properties"].get("thumbnailUrl", ""),
                    "original_url": video["properties"].get("originalUrl", ""),
                    "tags": video["properties"].get("tags", []),
                    "style": video["properties"].get("style", ""),
                    "music": video["properties"].get("music", ""),
                    "created_at": video["properties"].get("createdAt", "")
                },
                "similarity": video["similarity"],
                "matching_scenes": [
                    {
                        "id": scene["id"],
                        "start_time": scene["properties"].get("startTime", 0),
                        "end_time": scene["properties"].get("endTime", 0),
                        "description": scene["properties"].get("description", ""),
                        "tags": scene["properties"].get("tags", []),
                        "similarity": scene["similarity"]
                    }
                    for scene in video_scenes
                ]
            }
            results.append(result)
        
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "completed", "progress": 100}
        )
        
        return {
            "matches": results,
            "total_found": len(results),
            "search_query": search_query,
            "input_type": input_type
        }
        
    except Exception as e:
        logger.error(f"Error finding matching videos: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise

@celery_app.task(bind=True)
def analyze_image_for_matching(self, image_url: str) -> Dict[str, Any]:
    """
    Analyze an uploaded image using OpenAI Vision API to generate description for matching
    """
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "analyzing_image", "progress": 20}
        )
        
        # Use OpenAI Vision API to analyze the image
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this image and describe what you see in detail. Focus on: 1) The setting/location type, 2) Visual elements and composition, 3) Mood and atmosphere, 4) Any people or activities, 5) Style and aesthetic. This description will be used to find similar viral video content."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        description = response.choices[0].message.content
        
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "completed", "progress": 100}
        )
        
        return {
            "description": description,
            "image_url": image_url
        }
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise