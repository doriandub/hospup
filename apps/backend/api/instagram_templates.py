"""
API endpoints for Instagram templates.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from core.database import get_db
from models.instagram_template import InstagramTemplate
from core.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/api/v1/instagram-templates", tags=["instagram-templates"])

class InstagramTemplateResponse(BaseModel):
    id: str
    instagram_url: str
    instagram_id: str
    title: str
    description: str
    view_count: int
    like_count: int
    comment_count: int
    follower_count: int
    viral_score: float
    engagement_rate: float
    hashtags: List[str]
    category: str
    scene_types: List[str]
    prompt_suggestion: str
    difficulty_level: str
    author_username: str
    author_follower_count: int
    author_verified: bool
    duration_seconds: float
    aspect_ratio: str
    has_music: bool
    has_text_overlay: bool
    language: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[InstagramTemplateResponse])
async def get_instagram_templates(
    category: Optional[str] = None,
    limit: Optional[int] = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get Instagram templates, optionally filtered by category."""
    query = db.query(InstagramTemplate).filter(InstagramTemplate.is_active == True)
    
    if category:
        query = query.filter(InstagramTemplate.category == category)
    
    # Order by viral score descending
    query = query.order_by(InstagramTemplate.viral_score.desc())
    
    if limit:
        query = query.limit(limit)
    
    templates = query.all()
    return templates

@router.get("/{template_id}", response_model=InstagramTemplateResponse)
async def get_instagram_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific Instagram template."""
    template = db.query(InstagramTemplate).filter(
        InstagramTemplate.id == template_id,
        InstagramTemplate.is_active == True
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template

@router.get("/categories/list")
async def get_template_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all available template categories."""
    categories = db.query(InstagramTemplate.category).filter(
        InstagramTemplate.is_active == True
    ).distinct().all()
    
    return [cat[0] for cat in categories if cat[0]]