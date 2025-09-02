from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime

from core.database import get_db
from core.security import verify_password, get_password_hash
from models.user import User
from services.auth_service import AuthService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    plan: str
    videos_used: int
    videos_limit: int
    created_at: str

    class Config:
        from_attributes = True

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, request: Request, response: Response, db: Session = Depends(get_db)):
    """Register a new user with cookie-based authentication"""
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password)
    )
    
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"User registered successfully: {user.email}")
        
        # Create session cookie
        user_agent = request.headers.get("user-agent", "")
        client_ip = request.client.host if request.client else None
        
        session, cookie_value = AuthService.create_session_cookie(
            user.id, user_agent, client_ip, db
        )
        
        # Set secure cookie
        AuthService.set_auth_cookie(response, cookie_value)
        
        return UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            plan=user.plan,
            videos_used=user.videos_used,
            videos_limit=user.videos_limit,
            created_at=user.created_at.isoformat() if user.created_at else ""
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Registration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login", response_model=UserResponse)
async def login(user_data: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    """Login user with cookie-based authentication"""
    
    # Find user
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    try:
        # Create session cookie
        user_agent = request.headers.get("user-agent", "")
        client_ip = request.client.host if request.client else None
        
        session, cookie_value = AuthService.create_session_cookie(
            user.id, user_agent, client_ip, db
        )
        
        # Set secure cookie
        AuthService.set_auth_cookie(response, cookie_value)
        
        logger.info(f"User logged in successfully: {user.email}")
        
        return UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            plan=user.plan,
            videos_used=user.videos_used,
            videos_limit=user.videos_limit,
            created_at=user.created_at.isoformat() if user.created_at else ""
        )
        
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/logout")
async def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Logout user and invalidate session"""
    
    cookie_value = request.cookies.get("hospup_session")
    if cookie_value:
        AuthService.logout_session(cookie_value, db)
    
    # Clear cookie
    AuthService.clear_auth_cookie(response)
    
    return {"message": "Logged out successfully"}

@router.post("/logout-all")
async def logout_all(request: Request, response: Response, db: Session = Depends(get_db)):
    """Logout from all devices"""
    
    cookie_value = request.cookies.get("hospup_session")
    if not cookie_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Get user from session
    try:
        user = AuthService.get_user_from_session(cookie_value, db)
        AuthService.logout_all_sessions(user.id, db)
    except HTTPException:
        pass  # Session already invalid
    
    # Clear cookie
    AuthService.clear_auth_cookie(response)
    
    return {"message": "Logged out from all devices"}

@router.get("/me", response_model=UserResponse)
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Get current user information"""
    
    cookie_value = request.cookies.get("hospup_session")
    if not cookie_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user = AuthService.get_user_from_session(cookie_value, db)
    
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        plan=user.plan,
        videos_used=user.videos_used,
        videos_limit=user.videos_limit,
        created_at=user.created_at.isoformat() if user.created_at else ""
    )

@router.get("/check")
async def check_auth(request: Request, db: Session = Depends(get_db)):
    """Check if user is authenticated"""
    
    cookie_value = request.cookies.get("hospup_session")
    if not cookie_value:
        return {"authenticated": False}
    
    is_valid, user_id = AuthService.validate_session_cookie(cookie_value, db)
    
    return {
        "authenticated": is_valid,
        "user_id": user_id if is_valid else None
    }