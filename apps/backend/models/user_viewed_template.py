"""
Modèle pour tracker les templates viraux vus par les utilisateurs
"""

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from core.database import Base

class UserViewedTemplate(Base):
    """
    Table de liaison pour tracker quels templates viraux un utilisateur a vus
    Chaque fois qu'un template est affiché à l'utilisateur, on l'enregistre ici
    """
    __tablename__ = "user_viewed_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Relations - Using String to match User.id type
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    viral_template_id = Column(String, ForeignKey("viral_video_templates.id"), nullable=False)
    
    # Metadata
    viewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    context = Column(String, nullable=True)  # "initial_search", "new_idea_1", "new_idea_2", etc.
    
    # Relations (Disabled to fix SQLAlchemy circular import)
    # user = relationship("User", back_populates="viewed_templates")
    # viral_template = relationship("ViralVideoTemplate", back_populates="user_views")
    
    def __repr__(self):
        return f"<UserViewedTemplate(user_id={self.user_id}, template_id={self.viral_template_id}, viewed_at={self.viewed_at})>"