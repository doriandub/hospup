from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timedelta

from core.database import get_db
from core.auth import get_current_user
from models.user import User
from models.property import Property
from models.video import Video

router = APIRouter()

class DashboardStats(BaseModel):
    total_properties: int
    total_videos: int
    videos_this_month: int
    storage_used: float
    remaining_videos: int
    videos_limit: int
    videos_used: int

class ActivityItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    timestamp: str
    property_id: str = None
    video_id: str = None

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for the current user"""
    
    # Total properties
    total_properties = db.query(Property).filter(Property.user_id == current_user.id).count()
    
    # Total videos
    total_videos = db.query(Video).filter(Video.user_id == current_user.id).count()
    
    # Videos this month
    start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    videos_this_month = db.query(Video).filter(
        Video.user_id == current_user.id,
        Video.created_at >= start_of_month
    ).count()
    
    # Storage used (mock data for now - would calculate from actual file sizes)
    storage_used = 2.1  # GB
    
    # Remaining videos
    remaining_videos = current_user.remaining_videos
    
    return DashboardStats(
        total_properties=total_properties,
        total_videos=total_videos,
        videos_this_month=videos_this_month,
        storage_used=storage_used,
        remaining_videos=remaining_videos,
        videos_limit=current_user.videos_limit,
        videos_used=current_user.videos_used
    )

@router.get("/activity")
async def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity for the current user"""
    
    activities = []
    
    # Get recent videos
    recent_videos = db.query(Video).filter(
        Video.user_id == current_user.id
    ).order_by(Video.created_at.desc()).limit(limit).all()
    
    for video in recent_videos:
        activities.append(ActivityItem(
            id=str(video.id),
            type="video_generated" if video.status == "completed" else "video_processing",
            title=f"Video {'generated' if video.status == 'completed' else 'processing'} for {video.property.name}",
            description=f"Video {video.status}",
            timestamp=video.created_at.isoformat(),
            property_id=str(video.property_id),
            video_id=str(video.id)
        ))
    
    # Get recent properties
    recent_properties = db.query(Property).filter(
        Property.user_id == current_user.id
    ).order_by(Property.created_at.desc()).limit(limit).all()
    
    for property in recent_properties:
        activities.append(ActivityItem(
            id=str(property.id),
            type="property_created",
            title=f"New property added: {property.name}",
            description=f"{property.type.replace('_', ' ').title()} in {property.city}",
            timestamp=property.created_at.isoformat(),
            property_id=str(property.id)
        ))
    
    # Sort by timestamp and limit
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    return activities[:limit]

