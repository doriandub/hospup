"""
Database model for scraped Instagram video templates.

These templates are real Instagram videos that went viral and can serve
as inspiration for generating similar content with user properties.
"""

import uuid
from sqlalchemy import Column, String, Text, JSON, Integer, Float, DateTime, Boolean
from sqlalchemy.sql import func
from core.database import Base

class InstagramTemplate(Base):
    __tablename__ = "instagram_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Instagram data
    instagram_url = Column(String(255), nullable=False)
    instagram_id = Column(String(255), unique=True, nullable=False)
    
    # Video content
    video_url = Column(String(255))  # Direct video URL if available
    thumbnail_url = Column(String(255))  # Thumbnail/preview image
    
    # Metrics
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    follower_count = Column(Integer, default=0)  # Author's follower count
    
    # Calculated viral metrics
    viral_score = Column(Float)  # View/follower ratio or custom viral score
    engagement_rate = Column(Float)  # (likes + comments) / views
    
    # Content analysis
    description = Column(Text)  # Instagram caption/description
    hashtags = Column(JSON)  # List of hashtags used
    category = Column(String(100))  # hotel, restaurant, travel, etc.
    scene_types = Column(JSON)  # ["bedroom", "bathroom", "pool"] detected scenes
    
    # Template info
    title = Column(String(255), nullable=False)  # Our title for the template
    prompt_suggestion = Column(Text)  # Suggested prompt to recreate this
    difficulty_level = Column(String(20), default='easy')  # easy, medium, hard
    
    # Author info
    author_username = Column(String(255))
    author_follower_count = Column(Integer)
    author_verified = Column(Boolean, default=False)
    
    # Technical info
    duration_seconds = Column(Float)
    aspect_ratio = Column(String(20))  # 16:9, 9:16, 1:1
    has_music = Column(Boolean, default=False)
    has_text_overlay = Column(Boolean, default=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    language = Column(String(10), default='en')  # Language detected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<InstagramTemplate(title='{self.title}', viral_score={self.viral_score})>"
    
    @property
    def viral_ratio(self):
        """Calculate view-to-follower ratio as a viral indicator"""
        if not self.follower_count or self.follower_count == 0:
            return 0.0
        return self.view_count / self.follower_count
    
    @property
    def engagement_score(self):
        """Calculate engagement score"""
        if not self.view_count or self.view_count == 0:
            return 0.0
        return (self.like_count + self.comment_count) / self.view_count