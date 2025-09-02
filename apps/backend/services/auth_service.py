from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status, Request, Response
from datetime import datetime, timedelta
import uuid
import hashlib
import secrets

from models.session import UserSession
from models.user import User
from core.database import get_db

class AuthService:
    @staticmethod
    def create_session_cookie(user_id: str, user_agent: str = None, ip_address: str = None, db: Session = None) -> tuple[UserSession, str]:
        """Create a new session and return session object and cookie value"""
        if not db:
            db = next(get_db())
        
        # Clean up expired sessions for this user
        AuthService.cleanup_expired_sessions(user_id, db)
        
        # Create new session
        session = UserSession.create_session(user_id, user_agent, ip_address)
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Create secure cookie value (session_token hashed for security)
        cookie_value = f"{session.session_token}:{user_id}"
        
        return session, cookie_value
    
    @staticmethod
    def validate_session_cookie(cookie_value: str, db: Session = None) -> tuple[bool, str]:
        """Validate session cookie and return (is_valid, user_id)"""
        if not cookie_value or ':' not in cookie_value:
            return False, None
            
        try:
            session_token, user_id = cookie_value.split(':', 1)
        except ValueError:
            return False, None
        
        if not db:
            db = next(get_db())
        
        # Find active session
        session = db.query(UserSession).filter(
            and_(
                UserSession.session_token == session_token,
                UserSession.user_id == user_id,
                UserSession.is_active == True
            )
        ).first()
        
        if not session or not session.is_valid():
            return False, None
            
        # Refresh session if it's close to expiry (within 7 days)
        if session.expires_at < datetime.utcnow() + timedelta(days=7):
            session.refresh()
            db.commit()
            
        return True, user_id
    
    @staticmethod
    def get_user_from_session(cookie_value: str, db: Session = None) -> User:
        """Get user object from session cookie"""
        is_valid, user_id = AuthService.validate_session_cookie(cookie_value, db)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session"
            )
        
        if not db:
            db = next(get_db())
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        return user
    
    @staticmethod
    def logout_session(cookie_value: str, db: Session = None) -> bool:
        """Logout specific session"""
        if not cookie_value or ':' not in cookie_value:
            return False
            
        try:
            session_token, user_id = cookie_value.split(':', 1)
        except ValueError:
            return False
        
        if not db:
            db = next(get_db())
        
        session = db.query(UserSession).filter(
            UserSession.session_token == session_token
        ).first()
        
        if session:
            session.is_active = False
            db.commit()
            return True
            
        return False
    
    @staticmethod
    def logout_all_sessions(user_id: str, db: Session = None) -> int:
        """Logout all sessions for a user"""
        if not db:
            db = next(get_db())
        
        count = db.query(UserSession).filter(
            and_(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            )
        ).update({"is_active": False})
        
        db.commit()
        return count
    
    @staticmethod
    def cleanup_expired_sessions(user_id: str = None, db: Session = None) -> int:
        """Clean up expired sessions"""
        if not db:
            db = next(get_db())
        
        query = db.query(UserSession).filter(
            UserSession.expires_at < datetime.utcnow()
        )
        
        if user_id:
            query = query.filter(UserSession.user_id == user_id)
            
        count = query.update({"is_active": False})
        db.commit()
        return count
    
    @staticmethod
    def set_auth_cookie(response: Response, cookie_value: str) -> None:
        """Set secure authentication cookie"""
        response.set_cookie(
            key="hospup_session",
            value=cookie_value,
            httponly=True,  # Prevent XSS
            secure=True,    # HTTPS only
            samesite="lax", # CSRF protection
            max_age=30 * 24 * 60 * 60,  # 30 days
            path="/"
        )
    
    @staticmethod
    def clear_auth_cookie(response: Response) -> None:
        """Clear authentication cookie"""
        response.delete_cookie(
            key="hospup_session",
            httponly=True,
            secure=True,
            samesite="lax",
            path="/"
        )