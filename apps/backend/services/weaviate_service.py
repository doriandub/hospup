"""
Weaviate service for storing and querying video segment embeddings.

This service manages:
1. Vector storage for video segment embeddings
2. Similarity search for matching segments
3. Metadata filtering for scene types
"""

import weaviate
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from core.config import settings

logger = logging.getLogger(__name__)

class WeaviateService:
    """Service for managing video embeddings in Weaviate vector database"""
    
    def __init__(self):
        self.client = None
        self._connect()
        self._ensure_schema()
    
    def _connect(self):
        """Connect to Weaviate instance"""
        try:
            self.client = weaviate.Client(
                url=settings.WEAVIATE_URL,
                additional_headers={
                    "X-OpenAI-Api-Key": settings.WEAVIATE_API_KEY
                } if settings.WEAVIATE_API_KEY else None
            )
            
            if self.client.is_ready():
                logger.info("Connected to Weaviate successfully")
            else:
                logger.error("Failed to connect to Weaviate")
                
        except Exception as e:
            logger.error(f"Error connecting to Weaviate: {e}")
            self.client = None
    
    def _ensure_schema(self):
        """Ensure VideoSegment schema exists in Weaviate"""
        if not self.client:
            return
            
        try:
            # Check if class exists
            existing_classes = self.client.schema.get()['classes']
            class_names = [cls['class'] for cls in existing_classes]
            
            if 'VideoSegment' not in class_names:
                # Create VideoSegment class schema
                schema = {
                    "class": "VideoSegment",
                    "description": "Video segment with visual embedding and metadata",
                    "vectorizer": "none",  # We provide our own vectors
                    "properties": [
                        {
                            "name": "video_id",
                            "dataType": ["string"],
                            "description": "Reference to parent video"
                        },
                        {
                            "name": "description",
                            "dataType": ["text"],
                            "description": "AI-generated description of the segment"
                        },
                        {
                            "name": "scene_type",
                            "dataType": ["string"],
                            "description": "Type of scene (bedroom, pool, kitchen, etc.)"
                        },
                        {
                            "name": "start_time",
                            "dataType": ["number"],
                            "description": "Start time in seconds"
                        },
                        {
                            "name": "end_time",
                            "dataType": ["number"],
                            "description": "End time in seconds"
                        },
                        {
                            "name": "duration",
                            "dataType": ["number"],
                            "description": "Duration in seconds"
                        },
                        {
                            "name": "confidence_score",
                            "dataType": ["number"],
                            "description": "Analysis confidence score"
                        },
                        {
                            "name": "tags",
                            "dataType": ["string[]"],
                            "description": "List of detected objects/concepts"
                        },
                        {
                            "name": "property_id",
                            "dataType": ["string"],
                            "description": "Associated property ID"
                        },
                        {
                            "name": "user_id",
                            "dataType": ["string"],
                            "description": "Owner user ID"
                        },
                        {
                            "name": "is_viral_reference",
                            "dataType": ["boolean"],
                            "description": "Whether this is from a viral video template"
                        }
                    ]
                }
                
                self.client.schema.create_class(schema)
                logger.info("Created VideoSegment schema in Weaviate")
            else:
                logger.info("VideoSegment schema already exists")
                
        except Exception as e:
            logger.error(f"Error ensuring Weaviate schema: {e}")
    
    def add_video_segment(self, vector: List[float], properties: Dict[str, Any]) -> str:
        """
        Add a video segment embedding to Weaviate
        
        Args:
            vector: OpenCLIP embedding vector
            properties: Metadata properties
            
        Returns:
            String ID of created object
        """
        if not self.client:
            logger.error("Weaviate client not available")
            return ""
            
        try:
            # Add object to Weaviate
            result = self.client.data_object.create(
                data_object=properties,
                class_name="VideoSegment",
                vector=vector
            )
            
            object_id = result
            logger.info(f"Added video segment to Weaviate: {object_id}")
            return object_id
            
        except Exception as e:
            logger.error(f"Error adding video segment to Weaviate: {e}")
            return ""
    
    def search_similar_segments(
        self, 
        query_vector: List[float], 
        scene_type: Optional[str] = None,
        property_id: Optional[str] = None,
        limit: int = 10,
        min_confidence: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Search for similar video segments using vector similarity
        
        Args:
            query_vector: Query embedding vector
            scene_type: Optional scene type filter
            property_id: Optional property filter
            limit: Maximum number of results
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of similar segments with metadata and similarity scores
        """
        if not self.client:
            logger.error("Weaviate client not available")
            return []
            
        try:
            # Build query
            query_builder = self.client.query.get("VideoSegment", [
                "video_id", "description", "scene_type", "start_time", 
                "end_time", "duration", "confidence_score", "tags",
                "property_id", "user_id"
            ]).with_near_vector({
                "vector": query_vector
            }).with_limit(limit).with_additional(["certainty", "distance"])
            
            # Add filters if specified
            filters = []
            
            if scene_type:
                filters.append({
                    "path": ["scene_type"],
                    "operator": "Equal",
                    "valueString": scene_type
                })
            
            if property_id:
                filters.append({
                    "path": ["property_id"],
                    "operator": "Equal",
                    "valueString": property_id
                })
            
            if min_confidence > 0:
                filters.append({
                    "path": ["confidence_score"],
                    "operator": "GreaterThanEqual",
                    "valueNumber": min_confidence
                })
            
            if filters:
                if len(filters) == 1:
                    query_builder = query_builder.with_where(filters[0])
                else:
                    query_builder = query_builder.with_where({
                        "operator": "And",
                        "operands": filters
                    })
            
            # Execute query
            result = query_builder.do()
            
            # Process results
            segments = []
            if 'data' in result and 'Get' in result['data'] and 'VideoSegment' in result['data']['Get']:
                for item in result['data']['Get']['VideoSegment']:
                    # Extract metadata and additional info
                    segment_data = {
                        **item,
                        "similarity_score": item.get('_additional', {}).get('certainty', 0),
                        "distance": item.get('_additional', {}).get('distance', 1)
                    }
                    segments.append(segment_data)
            
            logger.info(f"Found {len(segments)} similar segments")
            return segments
            
        except Exception as e:
            logger.error(f"Error searching similar segments: {e}")
            return []
    
    def search_by_text_description(
        self, 
        text_query: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search segments by text description (semantic search)
        
        Args:
            text_query: Natural language query
            limit: Maximum results
            
        Returns:
            List of matching segments
        """
        if not self.client:
            return []
            
        try:
            result = self.client.query.get("VideoSegment", [
                "video_id", "description", "scene_type", "start_time", 
                "end_time", "duration", "tags"
            ]).with_near_text({
                "concepts": [text_query]
            }).with_limit(limit).with_additional(["certainty"]).do()
            
            segments = []
            if 'data' in result and 'Get' in result['data'] and 'VideoSegment' in result['data']['Get']:
                segments = result['data']['Get']['VideoSegment']
            
            return segments
            
        except Exception as e:
            logger.error(f"Error searching by text: {e}")
            return []
    
    def delete_video_segments(self, video_id: str) -> bool:
        """
        Delete all segments for a specific video
        
        Args:
            video_id: Video ID to delete segments for
            
        Returns:
            Success status
        """
        if not self.client:
            return False
            
        try:
            # Delete all objects with matching video_id
            self.client.batch.delete_objects(
                class_name="VideoSegment",
                where={
                    "path": ["video_id"],
                    "operator": "Equal",
                    "valueString": video_id
                }
            )
            
            logger.info(f"Deleted segments for video {video_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting video segments: {e}")
            return False
    
    def get_segment_stats(self) -> Dict[str, Any]:
        """Get statistics about stored segments"""
        if not self.client:
            return {}
            
        try:
            # Get total count
            result = self.client.query.aggregate("VideoSegment").with_meta_count().do()
            
            total_segments = 0
            if 'data' in result and 'Aggregate' in result['data']:
                total_segments = result['data']['Aggregate']['VideoSegment'][0]['meta']['count']
            
            # Get scene type distribution
            scene_types = self.client.query.aggregate("VideoSegment").with_group_by_filter([
                "scene_type"
            ]).with_meta_count().do()
            
            scene_distribution = {}
            if 'data' in scene_types and 'Aggregate' in scene_types['data']:
                for group in scene_types['data']['Aggregate']['VideoSegment']:
                    scene_type = group['groupedBy']['value']
                    count = group['meta']['count']
                    scene_distribution[scene_type] = count
            
            return {
                "total_segments": total_segments,
                "scene_distribution": scene_distribution,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting segment stats: {e}")
            return {}

# Create singleton instance
weaviate_service = WeaviateService()