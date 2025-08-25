from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from core.database import get_db
from core.auth import get_current_user
from models.user import User
from models.video import Video
from models.property import Property
from services.s3_service import s3_service
import json

router = APIRouter()

class VideoResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    video_url: str
    thumbnail_url: Optional[str] = None
    status: str
    language: str
    duration: Optional[float] = None
    format: str
    size: Optional[int] = None
    source_type: Optional[str] = None
    source_data: Optional[str] = None
    property_id: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VideoGenerationRequest(BaseModel):
    input_type: str  # photo, text
    input_data: str
    property_id: str
    language: str = "en"
    viral_video_id: Optional[str] = None

class VideoGenerationResponse(BaseModel):
    job_id: str
    status: str
    estimated_time: int = None
    video_id: str = None

@router.get("/", response_model=List[VideoResponse])
async def get_videos(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    video_type: Optional[str] = None,  # "uploaded" for Content Library, "generated" for Generated Videos
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all videos for current user"""
    query = db.query(Video).filter(Video.user_id == current_user.id)
    
    if property_id:
        query = query.filter(Video.property_id == property_id)
    
    if status:
        query = query.filter(Video.status == status)
    
    # Filter by video type
    if video_type == "uploaded":
        # Content Library: only uploaded videos (no viral_video_id)
        query = query.filter(Video.viral_video_id.is_(None))
    elif video_type == "generated":
        # Generated Videos: only AI-generated videos (has viral_video_id)
        query = query.filter(Video.viral_video_id.isnot(None))
    
    videos = query.order_by(Video.created_at.desc()).all()
    
    # Convert to response objects and refresh presigned URLs for completed videos
    video_responses = []
    for video in videos:
        video_response = VideoResponse.from_orm(video)
        
        # Generate fresh presigned URL for generated videos
        if video.source_data and video.status == "completed":
            try:
                metadata = json.loads(video.source_data)
                s3_key = metadata.get('s3_key')
                if s3_key:
                    fresh_url = s3_service.generate_presigned_download_url(s3_key, expires_in=86400)
                    video_response.video_url = fresh_url
            except Exception:
                pass  # Keep original URL if presigned generation fails
        
        # Generate presigned URL for thumbnails if stored in S3
        if video.thumbnail_url and video.thumbnail_url.startswith("https://hospup-files.s3.amazonaws.com/"):
            try:
                # Extract S3 key from thumbnail URL
                thumbnail_s3_key = video.thumbnail_url.split("https://hospup-files.s3.amazonaws.com/", 1)[1]
                fresh_thumbnail_url = s3_service.generate_presigned_download_url(thumbnail_s3_key, expires_in=86400)
                video_response.thumbnail_url = fresh_thumbnail_url
            except Exception:
                pass  # Keep original URL if presigned generation fails
                
        video_responses.append(video_response)
    
    return video_responses

@router.get("/content-library", response_model=List[VideoResponse])
async def get_content_library_videos(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get only Content Library videos (uploaded by user)"""
    query = db.query(Video).filter(
        Video.user_id == current_user.id,
        Video.viral_video_id.is_(None)  # Only uploaded videos
    )
    
    if property_id:
        query = query.filter(Video.property_id == property_id)
    
    if status:
        query = query.filter(Video.status == status)
    
    videos = query.order_by(Video.created_at.desc()).all()
    
    # Convert to response objects and generate presigned URLs for thumbnails
    video_responses = []
    for video in videos:
        video_response = VideoResponse.from_orm(video)
        
        # Generate presigned URL for thumbnails if stored in S3
        if video.thumbnail_url and video.thumbnail_url.startswith("https://hospup-files.s3.amazonaws.com/"):
            try:
                # Extract S3 key from thumbnail URL
                thumbnail_s3_key = video.thumbnail_url.split("https://hospup-files.s3.amazonaws.com/", 1)[1]
                fresh_thumbnail_url = s3_service.generate_presigned_download_url(thumbnail_s3_key, expires_in=86400)
                video_response.thumbnail_url = fresh_thumbnail_url
            except Exception:
                pass  # Keep original URL if presigned generation fails
                
        video_responses.append(video_response)
    
    return video_responses

@router.get("/generated", response_model=List[VideoResponse])
async def get_generated_videos(
    property_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get only AI-generated videos"""
    query = db.query(Video).filter(
        Video.user_id == current_user.id,
        Video.viral_video_id.isnot(None)  # Only generated videos
    )
    
    if property_id:
        query = query.filter(Video.property_id == property_id)
    
    if status:
        query = query.filter(Video.status == status)
    
    videos = query.order_by(Video.created_at.desc()).all()
    
    # Convert to response objects and refresh presigned URLs for completed videos
    video_responses = []
    for video in videos:
        video_response = VideoResponse.from_orm(video)
        
        # Generate fresh presigned URL for generated videos
        if video.source_data and video.status == "completed":
            try:
                metadata = json.loads(video.source_data)
                s3_key = metadata.get('s3_key')
                if s3_key:
                    fresh_url = s3_service.generate_presigned_download_url(s3_key, expires_in=86400)
                    video_response.video_url = fresh_url
            except Exception:
                pass  # Keep original URL if presigned generation fails
        
        # Generate presigned URL for thumbnails if stored in S3
        if video.thumbnail_url and video.thumbnail_url.startswith("https://hospup-files.s3.amazonaws.com/"):
            try:
                # Extract S3 key from thumbnail URL
                thumbnail_s3_key = video.thumbnail_url.split("https://hospup-files.s3.amazonaws.com/", 1)[1]
                fresh_thumbnail_url = s3_service.generate_presigned_download_url(thumbnail_s3_key, expires_in=86400)
                video_response.thumbnail_url = fresh_thumbnail_url
            except Exception:
                pass  # Keep original URL if presigned generation fails
                
        video_responses.append(video_response)
    
    return video_responses

@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific video"""
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id
    ).first()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    video_response = VideoResponse.from_orm(video)
    
    # Generate fresh presigned URL for generated videos
    if video.source_data and video.status == "completed":
        try:
            metadata = json.loads(video.source_data)
            s3_key = metadata.get('s3_key')
            if s3_key:
                fresh_url = s3_service.generate_presigned_download_url(s3_key, expires_in=86400)
                video_response.video_url = fresh_url
        except Exception:
            pass  # Keep original URL if presigned generation fails
    
    return video_response

@router.post("/generate", response_model=VideoGenerationResponse)
async def generate_video(
    generation_request: VideoGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start video generation process"""
    
    # Check if user can generate videos
    if not current_user.can_generate_video():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Video generation limit reached for your plan"
        )
    
    # Validate property ownership
    property = db.query(Property).filter(
        Property.id == generation_request.property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Validate input type
    if generation_request.input_type not in ["photo", "text"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input type. Must be 'photo' or 'text'"
        )
    
    # Create video record
    video = Video(
        title=f"Generated video for {property.name}",
        description=f"AI-generated video from {generation_request.input_type}",
        video_url="",  # Will be set after generation
        status="processing",
        language=generation_request.language,
        source_type=generation_request.input_type,
        source_data=generation_request.input_data,
        viral_video_id=generation_request.viral_video_id,
        user_id=current_user.id,
        property_id=generation_request.property_id
    )
    
    db.add(video)
    db.commit()
    db.refresh(video)
    
    # Start Celery job for video generation
    from tasks.video_generation import generate_video_from_template
    task = generate_video_from_template.delay(
        viral_video_id=generation_request.viral_video_id,
        property_id=generation_request.property_id,
        user_id=str(current_user.id),
        input_data=generation_request.input_data,
        input_type=generation_request.input_type,
        language=generation_request.language
    )
    job_id = task.id
    
    # Store the job ID in the video record
    video.generation_job_id = job_id
    
    # Update user's video count
    current_user.videos_used += 1
    db.commit()
    
    return VideoGenerationResponse(
        job_id=job_id,
        status="queued",
        estimated_time=300,  # 5 minutes estimate
        video_id=str(video.id)
    )

@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a video"""
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id
    ).first()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    db.delete(video)
    db.commit()
    
    return {"message": "Video deleted successfully"}

@router.get("/{video_id}/url")
async def get_video_url(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a fresh presigned URL for a video"""
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id
    ).first()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Extract S3 key from video
    s3_key = None
    
    # For generated videos: get S3 key from source_data
    if video.source_data:
        try:
            metadata = json.loads(video.source_data)
            s3_key = metadata.get('s3_key')
        except:
            pass
    
    # For uploaded videos: extract S3 key from video_url
    if not s3_key and video.video_url:
        if video.video_url.startswith("s3://"):
            try:
                # Extract key from s3://bucket-name/key format
                s3_key = video.video_url.split("s3://", 1)[1].split("/", 1)[1]
            except Exception:
                pass
        elif "hospup-files.s3" in video.video_url:
            try:
                # Extract key from full S3 URL
                s3_key = video.video_url.split("hospup-files.s3.amazonaws.com/", 1)[1].split("?", 1)[0]
            except Exception:
                pass
    
    if not s3_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video S3 key not found"
        )
    
    try:
        # Generate fresh presigned URL (expires in 24 hours)
        presigned_url = s3_service.generate_presigned_download_url(s3_key, expires_in=86400)
        
        return {
            "video_url": presigned_url,
            "expires_in": 86400
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate video URL"
        )

@router.post("/{video_id}/restart-processing")
async def restart_video_processing(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restart processing for a stuck video"""
    
    # Verify video belongs to user
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id
    ).first()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Only restart if video is in processing or uploaded state
    if video.status not in ["processing", "uploaded"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot restart video in {video.status} state"
        )
    
    try:
        # Reset video status to processing
        video.status = "processing"
        video.generation_job_id = None  # Clear old job ID
        db.commit()
        
        # Restart the processing task
        from tasks.video_processing_tasks import process_uploaded_video
        if video.source_data:
            import json
            metadata = json.loads(video.source_data)
            s3_key = metadata.get('s3_key')
            if s3_key:
                task = process_uploaded_video.delay(str(video.id), s3_key)
                video.generation_job_id = task.id
                db.commit()
                
                return {
                    "message": "Video processing restarted successfully",
                    "video_id": video_id,
                    "task_id": task.id
                }
        
        return {"message": "Video status reset to processing"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restart processing: {str(e)}"
        )

