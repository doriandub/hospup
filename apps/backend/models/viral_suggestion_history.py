"""
Model for tracking viral video suggestions shown to users
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base
import uuid

class ViralSuggestionHistory(Base):
    __tablename__ = "viral_suggestion_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    viral_video_id = Column(String, ForeignKey("viral_video_templates.id"), nullable=False)
    suggested_at = Column(DateTime, default=datetime.utcnow)
    context = Column(Text, nullable=True)  # Context when it was suggested (user's prompt)
    property_id = Column(String, ForeignKey("properties.id"), nullable=True)  # Property context
    
    # Relationships
    viral_video = relationship("ViralVideoTemplate")
    property = relationship("Property")