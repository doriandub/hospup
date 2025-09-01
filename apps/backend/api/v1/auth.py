from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_jwt_token
from models.user import User
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

router = APIRouter()

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict

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

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create a default property for the user
    try:
        from models.property import Property
        default_property = Property(
            name=f"{db_user.name}'s Property",
            user_id=db_user.id,
            property_type="hotel",
            description="Default property for video uploads"
        )
        db.add(default_property)
        db.commit()
        logger.info(f"Created default property for user {db_user.id}")
    except Exception as e:
        logger.warning(f"Failed to create default property: {e}")
    
    # Create tokens
    access_token = create_access_token(subject=str(db_user.id))
    refresh_token = create_refresh_token(subject=str(db_user.id))
    
    user_dict = {
        "id": str(db_user.id),
        "name": db_user.name,
        "email": db_user.email,
        "plan": db_user.plan,
        "videos_used": db_user.videos_used,
        "videos_limit": db_user.videos_limit,
        "created_at": db_user.created_at.isoformat()
    }
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_dict
    }

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    
    # Find user
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Create tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    user_dict = {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "plan": user.plan,
        "videos_used": user.videos_used,
        "videos_limit": user.videos_limit,
        "created_at": user.created_at.isoformat()
    }
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_dict
    }

# Import centralized auth function
from core.auth import get_current_user

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    return UserResponse.from_orm(current_user)