from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from services.auth_service import AuthService
from models.user import User

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Get current user from session cookie"""
    
    cookie_value = request.cookies.get("hospup_session")
    if not cookie_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Cookie"},
        )
    
    return AuthService.get_user_from_session(cookie_value, db)

def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> User | None:
    """Get current user from session cookie, return None if not authenticated"""
    
    cookie_value = request.cookies.get("hospup_session")
    if not cookie_value:
        return None
    
    try:
        return AuthService.get_user_from_session(cookie_value, db)
    except HTTPException:
        return None

def get_current_admin_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Get current user and ensure they are admin"""
    
    user = get_current_user(request, db)
    
    # Check if user is admin (you can implement admin role logic here)
    if not hasattr(user, 'is_admin') or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user