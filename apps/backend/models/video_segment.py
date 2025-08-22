from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from core.database import Base

class VideoSegment(Base):
    """Model for video segments/scenes with analysis data"""
    __tablename__ = "video_segments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    
    # Timing information
    start_time = Column(Float, nullable=False)  # seconds
    end_time = Column(Float, nullable=False)    # seconds
    duration = Column(Float, nullable=False)    # seconds
    
    # Analysis results
    description = Column(Text)                  # BLIP generated description
    tags = Column(JSON)                        # List of detected objects/concepts
    scene_type = Column(String)                # e.g., "bedroom", "pool", "kitchen"
    confidence_score = Column(Float)           # Analysis confidence
    
    # Vector embedding reference
    embedding_id = Column(String)              # Weaviate object ID
    
    # Technical metadata
    frame_count = Column(Integer)
    resolution_width = Column(Integer)
    resolution_height = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    video = relationship("Video")
    
    def __repr__(self):
        return f"<VideoSegment {self.id}: {self.start_time}s-{self.end_time}s ({self.scene_type})>"
    
    @property
    def segment_duration(self):
        """Get segment duration in seconds"""
        return self.end_time - self.start_time
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "video_id": self.video_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration": self.duration,
            "description": self.description,
            "tags": self.tags,
            "scene_type": self.scene_type,
            "confidence_score": self.confidence_score,
            "frame_count": self.frame_count,
            "resolution": f"{self.resolution_width}x{self.resolution_height}" if self.resolution_width else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }