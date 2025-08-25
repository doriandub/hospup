from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from core.database import get_db
from core.auth import get_current_user
from models.user import User
from models.property import Property
from models.video import Video
from services.s3_service import s3_service
from services.local_storage_service import local_storage_service
from core.config import settings
from tasks.video_processing_tasks import get_video_processing_status

router = APIRouter()
logger = logging.getLogger(__name__)

class UploadUrlRequest(BaseModel):
    file_name: str
    content_type: str
    property_id: str
    file_size: int

class UploadUrlResponse(BaseModel):
    upload_url: str
    fields: dict
    s3_key: str
    file_url: str
    expires_in: int

class VideoCreateRequest(BaseModel):
    property_id: str
    s3_key: str
    file_name: str
    file_size: int
    content_type: str

class VideoResponse(BaseModel):
    id: str
    title: str
    video_url: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/presigned-url", response_model=UploadUrlResponse)
async def get_upload_url(
    request: UploadUrlRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a presigned URL for uploading files to S3"""
    
    print(f"DEBUG - Upload request data: {request}")
    print(f"DEBUG - Property ID: {request.property_id}")
    print(f"DEBUG - User ID: {current_user.id}")
    
    # Validate property ownership
    property = db.query(Property).filter(
        Property.id == request.property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property:
        print(f"DEBUG - Property not found: {request.property_id} for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Validate file type
    allowed_video_types = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/avi',
        'video/mov',
        'application/octet-stream'  # Sometimes files upload with this type
    ]
    
    # Check if it's a video file (more permissive check)
    is_video = (
        request.content_type in allowed_video_types or
        any(request.file_name.lower().endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.wmv'])
    )
    
    if not is_video:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {request.content_type}. Only video files are allowed."
        )
    
    # Validate file size (100MB max)
    max_size = 100 * 1024 * 1024  # 100MB
    if request.file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {max_size // (1024 * 1024)}MB"
        )
    
    try:
        # Use storage backend based on configuration
        print(f"DEBUG - Storage backend setting: '{settings.STORAGE_BACKEND}'")
        if settings.STORAGE_BACKEND == "s3":
            upload_data = s3_service.generate_presigned_upload_url(
                file_name=request.file_name,
                content_type=request.content_type,
                property_id=request.property_id
            )
        else:
            upload_data = local_storage_service.generate_presigned_upload_url(
                file_name=request.file_name,
                content_type=request.content_type,
                property_id=request.property_id
            )
        
        print(f"DEBUG - Generated upload data: {upload_data}")
        return UploadUrlResponse(**upload_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL"
        )

@router.get("/download-url/{s3_key:path}")
async def get_download_url(
    s3_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a presigned URL for downloading files from S3"""
    
    # Extract property_id from s3_key (properties/{property_id}/videos/...)
    try:
        parts = s3_key.split('/')
        if len(parts) < 2 or parts[0] != 'properties':
            raise ValueError("Invalid S3 key format")
        
        property_id = parts[1]
        
        # Validate property ownership
        property = db.query(Property).filter(
            Property.id == property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        
        # Use storage backend based on configuration
        if settings.STORAGE_BACKEND == "s3":
            download_url = s3_service.generate_presigned_download_url(s3_key)
        else:
            download_url = local_storage_service.generate_presigned_download_url(s3_key)
        
        return {"download_url": download_url}
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL"
        )

@router.post("/complete", response_model=VideoResponse)
async def complete_upload(
    request: VideoCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a video record after successful file upload"""
    
    # Validate property ownership
    property = db.query(Property).filter(
        Property.id == request.property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Create video record with processing status (will be completed once AI description is generated)
    video = Video(
        title=request.file_name,
        video_url=f"s3://{s3_service.bucket_name}/{request.s3_key}",
        format=request.content_type.split('/')[-1],
        size=request.file_size,
        status="processing",  # Initial processing status
        user_id=current_user.id,
        property_id=request.property_id,
        description=f"Uploaded video: {request.file_name}"
    )
    
    db.add(video)
    db.commit()
    db.refresh(video)
    
    # Auto-detect environment and choose appropriate processing method
    from core.deployment import deployment_config
    
    config = deployment_config.get_processing_config()
    
    if config["use_async_processing"]:
        # Local/Production avec Celery - traitement asynchrone
        try:
            from tasks.video_processing_tasks import process_uploaded_video
            task = process_uploaded_video.delay(str(video.id), request.s3_key)
            
            video.generation_job_id = task.id
            db.commit()
            
            logger.info(f"🔄 Started async processing task {task.id} for video {video.id}")
        except Exception as e:
            logger.warning(f"❌ Async processing failed, video will remain as uploaded: {e}")
    else:
        # Vercel/Production sans Celery - traitement synchrone
        logger.info(f"🚀 Processing video synchronously (mode: {config['mode']})")
        
        try:
            # Import the synchronous processing function
            from api.v1.upload_vercel import process_video_sync
            
            # Process synchronously with timeout
            processed = await process_video_sync(
                video=video,
                s3_key=request.s3_key,
                db=db,
                config=config
            )
            
            if processed:
                logger.info(f"✅ Synchronous processing completed for video {video.id}")
            else:
                logger.warning(f"⚠️ Synchronous processing partial success for video {video.id}")
                
        except Exception as e:
            logger.error(f"❌ Synchronous processing failed: {e}")
            video.status = "uploaded"  # Fallback to uploaded status
            db.commit()
    
    return VideoResponse.from_orm(video)

@router.post("/local")
async def upload_local_file(
    file: UploadFile = File(...),
    s3_key: str = Form(...),
    local_path: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Handle local file upload for development"""
    try:
        # Read file content
        content = await file.read()
        
        # Save to local storage
        success = local_storage_service.save_file(content, local_path)
        
        if success:
            return {"status": "success", "message": "File uploaded successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upload failed"
        )

@router.get("/status/{video_id}")
async def get_processing_status(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get video processing status"""
    
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
    
    try:
        # Get processing status
        status_result = get_video_processing_status.delay(video_id)
        result = status_result.get(timeout=5)
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting processing status: {e}")
        return {
            "video_id": video_id,
            "status": video.status,
            "error": str(e)
        }

