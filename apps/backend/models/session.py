from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from core.database import Base
import uuid
from datetime import datetime, timedelta

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    session_token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    user_agent = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    
    @staticmethod
    def create_session(user_id: str, user_agent: str = None, ip_address: str = None) -> 'UserSession':
        """Create a new session for a user"""
        session = UserSession(
            user_id=user_id,
            session_token=str(uuid.uuid4()),
            expires_at=datetime.utcnow() + timedelta(days=30),  # 30 days expiry
            user_agent=user_agent,
            ip_address=ip_address
        )
        return session
    
    def is_valid(self) -> bool:
        """Check if session is still valid"""
        return (
            self.is_active and 
            self.expires_at > datetime.utcnow()
        )
    
    def refresh(self) -> None:
        """Extend session expiry"""
        self.expires_at = datetime.utcnow() + timedelta(days=30)
        self.updated_at = func.now()