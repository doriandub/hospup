from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from core.database import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Location
    address = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    # Property info
    property_type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    # Contact info
    website_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    instagram_handle = Column(String, nullable=True)
    
    # Settings
    language = Column(String, default="fr", nullable=True)
    is_active = Column(Boolean, default=True, nullable=True)
    
    # Text customization settings for video generation
    text_font = Column(String, default="Helvetica", nullable=True)  # Font family
    text_color = Column(String, default="#FFFFFF", nullable=True)   # Hex color
    text_size = Column(String, default="medium", nullable=True)     # small, medium, large
    text_shadow = Column(Boolean, default=False, nullable=True)     # Drop shadow
    text_outline = Column(Boolean, default=False, nullable=True)    # Text outline
    text_background = Column(Boolean, default=False, nullable=True) # Background box
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="properties")
    videos = relationship("Video", back_populates="property", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Property(id={self.id}, name={self.name})>"