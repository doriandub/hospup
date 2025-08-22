"""
Service for analyzing uploaded videos into segments with AI-powered scene detection and description.

This service handles:
1. Scene detection with PySceneDetect
2. Frame analysis with BLIP for descriptions
3. Visual embeddings with OpenCLIP
4. Storage in Weaviate vector database
"""

import os
import cv2
import torch
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import tempfile
import logging
from datetime import datetime
import json

# Video processing
from scenedetect import VideoManager, SceneManager
from scenedetect.detectors import ContentDetector
import ffmpeg

# AI models for analysis
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
# import open_clip  # Temporarily disabled - will install later

# Database
from sqlalchemy.orm import Session
from models.video import Video
from models.video_segment import VideoSegment
from services.weaviate_service import weaviate_service
from core.database import SessionLocal

logger = logging.getLogger(__name__)

class VideoAnalysisService:
    """Service for comprehensive video analysis and segmentation"""
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._blip_processor = None
        self._blip_model = None
        self._clip_model = None
        self._clip_preprocess = None
        self._clip_tokenizer = None
        
    def _load_models(self):
        """Lazy load AI models to save memory"""
        if self._blip_processor is None:
            logger.info("Loading BLIP model for image captioning...")
            self._blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            self._blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(self.device)
            
        if self._clip_model is None:
            logger.info("OpenCLIP temporarily disabled - using placeholder embeddings")
            # TODO: Install open-clip-torch and uncomment this
            # self._clip_model, _, self._clip_preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')
            # self._clip_tokenizer = open_clip.get_tokenizer('ViT-B-32')
            # self._clip_model = self._clip_model.to(self.device)
    
    def analyze_video(self, video_id: str, video_path: str) -> bool:
        """
        Main entry point for video analysis
        
        Args:
            video_id: Database ID of the video
            video_path: Local path to video file
            
        Returns:
            bool: Success status
        """
        try:
            logger.info(f"Starting analysis for video {video_id}")
            
            # 1. Detect scenes in video
            scenes = self._detect_scenes(video_path)
            logger.info(f"Detected {len(scenes)} scenes")
            
            # 2. Extract and analyze key frames for each scene
            segments_data = []
            for i, (start_time, end_time) in enumerate(scenes):
                segment_data = self._analyze_scene(video_path, start_time, end_time, i)
                if segment_data:
                    segments_data.append(segment_data)
            
            # 3. Save segments to database
            self._save_segments_to_db(video_id, segments_data)
            
            # 4. Update video status
            self._update_video_status(video_id, "analyzed")
            
            logger.info(f"Successfully analyzed video {video_id} with {len(segments_data)} segments")
            return True
            
        except Exception as e:
            logger.error(f"Error analyzing video {video_id}: {e}")
            self._update_video_status(video_id, "analysis_failed")
            return False
    
    def _detect_scenes(self, video_path: str, threshold: float = 30.0) -> List[Tuple[float, float]]:
        """
        Detect scene changes in video using PySceneDetect
        
        Args:
            video_path: Path to video file
            threshold: Sensitivity threshold for scene detection
            
        Returns:
            List of (start_time, end_time) tuples in seconds
        """
        try:
            # Create video manager and scene manager
            video_manager = VideoManager([video_path])
            scene_manager = SceneManager()
            
            # Add content detector with specified threshold
            scene_manager.add_detector(ContentDetector(threshold=threshold))
            
            # Start video manager
            video_manager.start()
            
            # Perform scene detection
            scene_manager.detect_scenes(frame_source=video_manager)
            
            # Get scene list
            scene_list = scene_manager.get_scene_list()
            
            # Convert to seconds and return
            scenes = []
            for scene in scene_list:
                start_sec = scene[0].get_seconds()
                end_sec = scene[1].get_seconds()
                scenes.append((start_sec, end_sec))
            
            video_manager.release()
            return scenes
            
        except Exception as e:
            logger.error(f"Error detecting scenes: {e}")
            return []
    
    def _analyze_scene(self, video_path: str, start_time: float, end_time: float, scene_index: int) -> Optional[Dict[str, Any]]:
        """
        Analyze a single scene segment
        
        Args:
            video_path: Path to video file
            start_time: Scene start time in seconds
            end_time: Scene end time in seconds
            scene_index: Index of the scene
            
        Returns:
            Dictionary with analysis results
        """
        try:
            # Extract middle frame as representative
            mid_time = (start_time + end_time) / 2
            frame = self._extract_frame(video_path, mid_time)
            
            if frame is None:
                return None
            
            # Load models if needed
            self._load_models()
            
            # Generate description with BLIP
            description = self._generate_description(frame)
            
            # Generate visual embedding with CLIP
            embedding = self._generate_embedding(frame)
            
            # Store embedding in Weaviate
            embedding_id = self._store_embedding_in_weaviate(embedding, {
                "description": description,
                "start_time": start_time,
                "end_time": end_time,
                "duration": end_time - start_time,
                "scene_index": scene_index
            })
            
            # Extract scene type from description (basic keyword matching)
            scene_type = self._extract_scene_type(description)
            
            # Get video metadata
            video_info = self._get_video_info(video_path)
            
            return {
                "start_time": start_time,
                "end_time": end_time,
                "duration": end_time - start_time,
                "description": description,
                "scene_type": scene_type,
                "embedding_id": embedding_id,
                "confidence_score": 0.8,  # Default confidence
                "frame_count": int((end_time - start_time) * video_info.get("fps", 30)),
                "resolution_width": video_info.get("width"),
                "resolution_height": video_info.get("height"),
                "tags": self._extract_tags_from_description(description)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing scene {scene_index}: {e}")
            return None
    
    def _extract_frame(self, video_path: str, time_sec: float) -> Optional[np.ndarray]:
        """Extract a frame from video at specified time"""
        try:
            cap = cv2.VideoCapture(video_path)
            
            # Set position to desired time
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_number = int(time_sec * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            
            ret, frame = cap.read()
            cap.release()
            
            if ret:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                return frame_rgb
            return None
            
        except Exception as e:
            logger.error(f"Error extracting frame at {time_sec}s: {e}")
            return None
    
    def _generate_description(self, frame: np.ndarray) -> str:
        """Generate description for frame using BLIP"""
        try:
            # Convert to PIL Image
            image = Image.fromarray(frame)
            
            # Process with BLIP
            inputs = self._blip_processor(image, return_tensors="pt").to(self.device)
            out = self._blip_model.generate(**inputs, max_length=50)
            description = self._blip_processor.decode(out[0], skip_special_tokens=True)
            
            return description
            
        except Exception as e:
            logger.error(f"Error generating description: {e}")
            return "Scene description unavailable"
    
    def _generate_embedding(self, frame: np.ndarray) -> np.ndarray:
        """Generate visual embedding using OpenCLIP (placeholder for now)"""
        try:
            # TODO: Implement OpenCLIP embedding generation
            # For now, create a simple hash-based embedding
            import hashlib
            
            # Create a simple feature vector from image statistics
            mean_color = np.mean(frame, axis=(0, 1))
            std_color = np.std(frame, axis=(0, 1))
            
            # Create hash from frame data for consistency
            frame_bytes = frame.tobytes()
            hash_obj = hashlib.md5(frame_bytes)
            hash_int = int(hash_obj.hexdigest()[:8], 16)
            
            # Create 512-dimensional embedding (same as OpenCLIP would produce)
            embedding = np.random.RandomState(hash_int).randn(512).astype(np.float32)
            
            # Add some actual image features
            embedding[:3] = mean_color / 255.0  # Normalized RGB means
            embedding[3:6] = std_color / 255.0  # Normalized RGB stds
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return np.zeros(512)  # Default empty embedding
    
    def _store_embedding_in_weaviate(self, embedding: np.ndarray, metadata: Dict[str, Any]) -> str:
        """Store embedding and metadata in Weaviate"""
        try:
            # Store in Weaviate vector database
            object_id = weaviate_service.add_video_segment(
                vector=embedding.tolist(),
                properties=metadata
            )
            return object_id
            
        except Exception as e:
            logger.error(f"Error storing embedding in Weaviate: {e}")
            return ""
    
    def _extract_scene_type(self, description: str) -> str:
        """Extract scene type from description using keyword matching"""
        # Define scene type keywords
        scene_keywords = {
            "bedroom": ["bed", "bedroom", "pillow", "blanket"],
            "kitchen": ["kitchen", "stove", "refrigerator", "counter"],
            "bathroom": ["bathroom", "toilet", "shower", "sink"],
            "living_room": ["living room", "sofa", "couch", "television"],
            "pool": ["pool", "swimming", "water", "poolside"],
            "restaurant": ["restaurant", "dining", "table", "food"],
            "hotel_lobby": ["lobby", "reception", "front desk"],
            "outdoor": ["outdoor", "garden", "terrace", "balcony"],
            "spa": ["spa", "massage", "wellness", "relaxation"]
        }
        
        description_lower = description.lower()
        
        for scene_type, keywords in scene_keywords.items():
            if any(keyword in description_lower for keyword in keywords):
                return scene_type
                
        return "general"
    
    def _extract_tags_from_description(self, description: str) -> List[str]:
        """Extract relevant tags from description"""
        # Simple tag extraction - can be enhanced with NLP
        common_objects = [
            "bed", "pool", "kitchen", "bathroom", "food", "person", "room",
            "table", "chair", "window", "door", "water", "garden", "building"
        ]
        
        tags = []
        description_lower = description.lower()
        
        for obj in common_objects:
            if obj in description_lower:
                tags.append(obj)
                
        return tags
    
    def _get_video_info(self, video_path: str) -> Dict[str, Any]:
        """Get video metadata using ffprobe"""
        try:
            probe = ffmpeg.probe(video_path)
            video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
            
            if video_stream:
                return {
                    "width": int(video_stream.get('width', 0)),
                    "height": int(video_stream.get('height', 0)),
                    "fps": eval(video_stream.get('r_frame_rate', '30/1')),
                    "duration": float(video_stream.get('duration', 0))
                }
            return {}
            
        except Exception as e:
            logger.error(f"Error getting video info: {e}")
            return {}
    
    def _save_segments_to_db(self, video_id: str, segments_data: List[Dict[str, Any]]):
        """Save analyzed segments to database"""
        db = SessionLocal()
        try:
            for segment_data in segments_data:
                segment = VideoSegment(
                    video_id=video_id,
                    **segment_data
                )
                db.add(segment)
            
            db.commit()
            logger.info(f"Saved {len(segments_data)} segments for video {video_id}")
            
        except Exception as e:
            logger.error(f"Error saving segments to database: {e}")
            db.rollback()
        finally:
            db.close()
    
    def _update_video_status(self, video_id: str, status: str):
        """Update video analysis status"""
        db = SessionLocal()
        try:
            video = db.query(Video).filter(Video.id == video_id).first()
            if video:
                video.status = status
                if status == "analyzed":
                    video.completed_at = datetime.utcnow()
                db.commit()
                
        except Exception as e:
            logger.error(f"Error updating video status: {e}")
        finally:
            db.close()
    
    def find_similar_segments(self, query_embedding: np.ndarray, scene_type: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Find similar video segments using vector similarity
        
        This is the core function for matching viral video patterns to user content
        """
        try:
            # Search in Weaviate for similar embeddings
            results = weaviate_service.search_similar_segments(
                query_vector=query_embedding.tolist(),
                scene_type=scene_type,
                limit=limit
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error finding similar segments: {e}")
            return []

# Create singleton instance
video_analysis_service = VideoAnalysisService()