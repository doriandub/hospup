from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from core.database import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # File info
    video_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    format = Column(String, default="mp4", nullable=False)
    duration = Column(Float, nullable=True)  # in seconds
    size = Column(Integer, nullable=True)  # in bytes
    
    # Status and processing
    status = Column(String, default="processing", nullable=False)  # processing, completed, failed
    language = Column(String, default="en", nullable=False)
    
    # Generation metadata
    source_type = Column(String, nullable=True)  # photo, text
    source_data = Column(Text, nullable=True)  # original input
    viral_video_id = Column(String, nullable=True)  # reference to matched viral video
    generation_job_id = Column(String, nullable=True)  # Celery job ID
    
    # Relationships
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    property_id = Column(String, ForeignKey("properties.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="videos")
    property = relationship("Property", back_populates="videos")
    
    def __repr__(self):
        return f"<Video(id={self.id}, title={self.title}, status={self.status})>"