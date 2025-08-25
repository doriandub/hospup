"""
Database model for viral video templates.
Simplified structure matching Airtable columns exactly.
"""

import uuid
from sqlalchemy import Column, String, Text, Float, DateTime, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class ViralVideoTemplate(Base):
    __tablename__ = "viral_video_templates"
    
    # Technical columns
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Airtable columns EXACT mapping
    title = Column(Text)
    hotel_name = Column(Text)
    username = Column(Text)
    property = Column(Text)
    country = Column(Text)
    video_link = Column(Text)
    account_link = Column(Text)
    followers = Column(BigInteger, default=0)
    views = Column(BigInteger, default=0)
    likes = Column(BigInteger, default=0)
    comments = Column(BigInteger, default=0)
    duration = Column(Float, default=30.0)
    script = Column(Text)
    audio_url = Column(Text)
    ratio = Column(Float)
    
    # Relationships
    # user_views = relationship("UserViewedTemplate", back_populates="viral_template", cascade="all, delete-orphan")  # Disabled to fix SQLAlchemy circular import
    
    def __repr__(self):
        return f"<ViralVideoTemplate(title='{self.title}', hotel_name='{self.hotel_name}')>"