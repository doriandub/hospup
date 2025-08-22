import weaviate
from weaviate.classes.config import Configure
import numpy as np
from typing import List, Dict, Any, Optional
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class WeaviateClient:
    def __init__(self):
        try:
            self.client = weaviate.connect_to_local(
                host=settings.WEAVIATE_HOST,
                port=settings.WEAVIATE_PORT,
                grpc_port=settings.WEAVIATE_GRPC_PORT
            )
            logger.info("Connected to Weaviate")
        except Exception as e:
            logger.error(f"Failed to connect to Weaviate: {e}")
            self.client = None

    def setup_schema(self):
        """Create the schema for viral videos and scenes"""
        if not self.client:
            return False
            
        try:
            # Create ViralVideo collection
            viral_videos = self.client.collections.get("ViralVideo")
            if not viral_videos.exists():
                self.client.collections.create(
                    name="ViralVideo",
                    vectorizer_config=Configure.Vectorizer.text2vec_openai(
                        model="text-embedding-3-small"
                    ),
                    properties=[
                        weaviate.classes.config.Property(
                            name="title",
                            data_type=weaviate.classes.config.DataType.TEXT
                        ),
                        weaviate.classes.config.Property(
                            name="description", 
                            data_type=weaviate.classes.config.DataType.TEXT
                        ),
                        weaviate.classes.config.Property(
                            name="thumbnailUrl",
                            data_type=weaviate.classes.config.DataType.TEXT
                        ),
                        weaviate.classes.config.Property(
                            name="originalUrl",
                            data_type=weaviate.classes.config.DataType.TEXT
                        ),
                        weaviate.classes.config.Property(
                            name="tags",
                            data_type=weaviate.classes.config.DataType.TEXT_ARRAY
                        ),
                        weaviate.classes.config.Property(
                            name="style",
                            data_type=weaviate.classes.config.DataType.TEXT
                        ),
                        weaviate.classes.config.Property(
                            name="music",
                            data_type=weaviate.classes.config.DataType.TEXT
                        ),
                        weaviate.classes.config.Property(
                            name="createdAt",
                            data_type=weaviate.classes.config.DataType.DATE
                        )
                    ]
                )
                logger.info("Created ViralVideo collection")

            # Create VideoScene collection
            scenes = self.client.collections.get("VideoScene")
            if not scenes.exists():
                self.client.collections.create(
                    name="VideoScene",
                    vectorizer_config=Configure.Vectorizer.text2vec_openai(
                        model="text-embedding-3-small"
                    ),
                    properties=[
                        weaviate.classes.config.Property(
                            name="viralVideoId",
                            data_type=weaviate.classes.config.DataType.TEXT
                        ),
                        weaviate.classes.config.Property(
                            name="startTime",
                            data_type=weaviate.classes.config.DataType.NUMBER
                        ),
                        weaviate.classes.config.Property(
                            name="endTime", 
                            data_type=weaviate.classes.config.DataType.NUMBER
                        ),
                        weaviate.classes.config.Property(
                            name="description",
                            data_type=weaviate.classes.config.DataType.TEXT
                        ),
                        weaviate.classes.config.Property(
                            name="tags",
                            data_type=weaviate.classes.config.DataType.TEXT_ARRAY
                        )
                    ]
                )
                logger.info("Created VideoScene collection")
                
            return True
        except Exception as e:
            logger.error(f"Failed to setup schema: {e}")
            return False

    def add_viral_video(self, video_data: Dict[str, Any]) -> Optional[str]:
        """Add a viral video to the collection"""
        if not self.client:
            return None
            
        try:
            collection = self.client.collections.get("ViralVideo")
            result = collection.data.insert(video_data)
            logger.info(f"Added viral video: {result}")
            return str(result)
        except Exception as e:
            logger.error(f"Failed to add viral video: {e}")
            return None

    def add_video_scene(self, scene_data: Dict[str, Any]) -> Optional[str]:
        """Add a video scene to the collection"""
        if not self.client:
            return None
            
        try:
            collection = self.client.collections.get("VideoScene")
            result = collection.data.insert(scene_data)
            logger.info(f"Added video scene: {result}")
            return str(result)
        except Exception as e:
            logger.error(f"Failed to add video scene: {e}")
            return None

    def search_similar_videos(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for similar viral videos based on text query"""
        if not self.client:
            return []
            
        try:
            collection = self.client.collections.get("ViralVideo")
            result = collection.query.near_text(
                query=query,
                limit=limit,
                return_metadata=weaviate.classes.query.MetadataQuery(distance=True)
            )
            
            videos = []
            for item in result.objects:
                video = {
                    "id": str(item.uuid),
                    "properties": item.properties,
                    "similarity": 1 - item.metadata.distance
                }
                videos.append(video)
                
            return videos
        except Exception as e:
            logger.error(f"Failed to search videos: {e}")
            return []

    def search_similar_scenes(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search for similar video scenes based on text query"""
        if not self.client:
            return []
            
        try:
            collection = self.client.collections.get("VideoScene")
            result = collection.query.near_text(
                query=query,
                limit=limit,
                return_metadata=weaviate.classes.query.MetadataQuery(distance=True)
            )
            
            scenes = []
            for item in result.objects:
                scene = {
                    "id": str(item.uuid),
                    "properties": item.properties,
                    "similarity": 1 - item.metadata.distance
                }
                scenes.append(scene)
                
            return scenes
        except Exception as e:
            logger.error(f"Failed to search scenes: {e}")
            return []

    def close(self):
        """Close the Weaviate connection"""
        if self.client:
            self.client.close()

# Global instance
weaviate_client = WeaviateClient()