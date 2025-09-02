"""
OpenAI Vision API service for video analysis
Replaces BLIP for more reliable and faster AI analysis
"""

import logging
import base64
import tempfile
import os
from typing import Optional, Dict, Any
from openai import OpenAI
from PIL import Image
import cv2
import numpy as np

logger = logging.getLogger(__name__)

class OpenAIVisionService:
    """Service for analyzing video content using OpenAI Vision API"""
    
    def __init__(self):
        self.client = None
        self._is_initialized = False
        
    def _initialize_client(self):
        """Initialize OpenAI client (lazy loading)"""
        if self._is_initialized:
            return
            
        try:
            from core.config import settings
            if not settings.OPENAI_API_KEY:
                logger.warning("⚠️ OPENAI_API_KEY not configured - Vision analysis disabled")
                return
                
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self._is_initialized = True
            logger.info("✅ OpenAI Vision service initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize OpenAI Vision service: {e}")
            
    def extract_video_frames(self, video_path: str, max_frames: int = 5) -> list:
        """Extract frames from video for analysis"""
        frames = []
        
        try:
            # Open video with OpenCV
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            if total_frames == 0:
                logger.warning(f"No frames found in video: {video_path}")
                return frames
                
            # Calculate frame indices to extract (evenly distributed)
            frame_indices = np.linspace(0, total_frames - 1, min(max_frames, total_frames), dtype=int)
            
            for frame_idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                
                if ret:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(frame_rgb)
                    
            cap.release()
            logger.info(f"✅ Extracted {len(frames)} frames from video")
            
        except Exception as e:
            logger.error(f"❌ Failed to extract frames: {e}")
            
        return frames
        
    def frame_to_base64(self, frame: np.ndarray) -> str:
        """Convert frame to base64 for OpenAI API"""
        try:
            # Convert to PIL Image
            image = Image.fromarray(frame)
            
            # Resize if too large (OpenAI has size limits)
            max_size = 1024
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            import io
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG', quality=85)
            
            # Encode to base64
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return f"data:image/jpeg;base64,{image_base64}"
            
        except Exception as e:
            logger.error(f"❌ Failed to convert frame to base64: {e}")
            return ""
    
    def analyze_video_content(self, video_path: str, max_frames: int = 5, timeout: int = 30) -> str:
        """
        Analyze video content using OpenAI Vision API
        
        Args:
            video_path: Path to video file
            max_frames: Maximum frames to analyze
            timeout: API timeout in seconds
            
        Returns:
            AI-generated description of video content
        """
        
        self._initialize_client()
        
        if not self.client:
            return "Video uploaded successfully - AI analysis unavailable (OpenAI not configured)"
            
        try:
            logger.info(f"🔍 Analyzing video with OpenAI Vision: {video_path}")
            
            # Extract frames from video
            frames = self.extract_video_frames(video_path, max_frames)
            
            if not frames:
                return "Video uploaded successfully - Unable to extract frames for analysis"
            
            # Use first few frames for analysis
            analysis_frames = frames[:min(3, len(frames))]  # Limit to 3 frames for cost efficiency
            
            # Convert frames to base64
            frame_images = []
            for frame in analysis_frames:
                base64_image = self.frame_to_base64(frame)
                if base64_image:
                    frame_images.append({
                        "type": "image_url",
                        "image_url": {"url": base64_image}
                    })
            
            if not frame_images:
                return "Video uploaded successfully - Unable to process frames for analysis"
            
            # Create OpenAI Vision API request
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this video content and provide a detailed description for social media. Focus on: 1) Main subject/activity 2) Setting/location 3) Visual style 4) Key elements that would make it engaging. Be concise but descriptive (max 150 words)."
                        }
                    ] + frame_images
                }
            ]
            
            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # More cost-effective than gpt-4-vision
                messages=messages,
                max_tokens=200,
                timeout=timeout
            )
            
            # Extract description
            description = response.choices[0].message.content.strip()
            
            if description:
                logger.info(f"✅ OpenAI Vision analysis completed: {description[:100]}...")
                return f"AI Analysis: {description}"
            else:
                logger.warning("⚠️ OpenAI Vision returned empty response")
                return "Video uploaded successfully - AI analysis completed but no description generated"
                
        except Exception as e:
            logger.error(f"❌ OpenAI Vision analysis failed: {e}")
            return f"Video uploaded successfully - AI analysis failed: {str(e)}"

# Global instance
openai_vision_service = OpenAIVisionService()