from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # Plan and limits
    plan = Column(String, default="free", nullable=False)  # free, pro, enterprise
    videos_used = Column(Integer, default=0, nullable=False)
    videos_limit = Column(Integer, default=2, nullable=False)
    
    # Billing
    subscription_id = Column(String, nullable=True)
    customer_id = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    properties = relationship("Property", back_populates="user", cascade="all, delete-orphan")
    videos = relationship("Video", back_populates="user", cascade="all, delete-orphan")
    # viewed_templates = relationship("UserViewedTemplate", back_populates="user", cascade="all, delete-orphan")  # Disabled to fix SQLAlchemy circular import
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, plan={self.plan})>"
    
    @property
    def remaining_videos(self) -> int:
        """Calculate remaining video generation quota"""
        if self.plan == "enterprise":
            return -1  # Unlimited
        return max(0, self.videos_limit - self.videos_used)
    
    def can_generate_video(self) -> bool:
        """Check if user can generate another video"""
        if self.plan == "enterprise":
            return True
        return self.videos_used < self.videos_limit