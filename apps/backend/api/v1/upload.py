from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import logging
import uuid

from core.database import get_db
from core.auth import get_current_user
from models.user import User
from models.property import Property
from models.video import Video
from services.s3_service import s3_service

router = APIRouter()
logger = logging.getLogger(__name__)

class VideoResponse(BaseModel):
    id: str
    title: str
    video_url: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/download-url/{s3_key:path}")
async def get_download_url(
    s3_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a presigned URL for downloading files from S3"""
    
    try:
        logger.info(f"Getting download URL for s3_key: {s3_key}")
        
        # Check if user has access to any video with this S3 key
        full_s3_url = f"s3://hospup-files/{s3_key}"
        
        # Find video that belongs to user's properties
        video = db.query(Video).join(Property).filter(
            Video.video_url == full_s3_url,
            Property.user_id == current_user.id
        ).first()
        
        if not video:
            logger.warning(f"No video found for s3_key: {s3_key} and user: {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found or access denied"
            )
        
        download_url = s3_service.generate_presigned_download_url(s3_key)
        
        logger.info(f"Generated download URL successfully for s3_key: {s3_key}")
        return {"download_url": download_url}
        
    except Exception as e:
        logger.error(f"Failed to generate download URL for s3_key: {s3_key}, error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL"
        )

@router.post("/", response_model=VideoResponse)
async def upload_video_direct(
    file: UploadFile = File(...),
    property_id: str = Form(...),
    title: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Direct video upload endpoint - production ready
    Upload via backend → Stream to S3 → Process automatically
    """
    
    logger.info(f"🎬 Direct upload started: {file.filename} for property {property_id}")
    
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
    
    # Validate file type
    allowed_video_types = [
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 
        'video/x-ms-wmv', 'video/avi', 'video/mov',
        'application/octet-stream'
    ]
    
    is_video = (
        file.content_type in allowed_video_types or
        any(file.filename.lower().endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.wmv'])
    )
    
    if not is_video:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Only video files are allowed."
        )
    
    try:
        # Generate unique file key
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        s3_key = f"properties/{property_id}/videos/{unique_filename}"
        
        # Stream directly to S3 (scalable - no local storage)
        logger.info(f"☁️ Streaming to S3: {s3_key}")
        
        # Reset file pointer to beginning
        await file.seek(0)
        
        # Upload file stream directly to S3
        upload_result = s3_service.upload_file_direct(
            file.file,  # Direct file stream, no memory storage
            s3_key, 
            file.content_type or 'video/mp4'
        )
        
        if not upload_result['success']:
            raise Exception(f"S3 upload failed: {upload_result.get('error')}")
        
        # Get file size (approximation if not available)
        file_size = getattr(file, 'size', 0) or 0
        if file_size == 0:
            # Try to get size from file if possible
            try:
                await file.seek(0, 2)  # Seek to end
                file_size = await file.tell()
                await file.seek(0)     # Reset to beginning
            except:
                file_size = 1024 * 1024  # Default 1MB if can't determine
        
        video_url = f"s3://{s3_service.bucket_name}/{s3_key}"
        
        # Create video record with "processing" status
        video = Video(
            title=title or file.filename,
            video_url=video_url,
            format=file_extension,
            size=file_size,
            status="processing",  # Will be auto-processed by Celery
            user_id=current_user.id,
            property_id=property_id,
            description=f"Uploaded video: {file.filename}"
        )
        
        db.add(video)
        db.commit()
        db.refresh(video)
        
        # Trigger automatic processing
        logger.info(f"🚀 Triggering video processing for {video.id}")
        
        # Auto-detect environment and choose appropriate processing method
        from core.deployment import deployment_config
        config = deployment_config.get_processing_config()
        
        if config["use_async_processing"]:
            # Celery processing - the recovery system will handle stuck videos
            try:
                from tasks.video_processing_tasks import process_uploaded_video
                task = process_uploaded_video.delay(str(video.id), s3_key)
                video.generation_job_id = task.id
                db.commit()
                logger.info(f"🔄 Async processing task {task.id} started for video {video.id}")
            except Exception as e:
                logger.warning(f"❌ Async processing failed, recovery system will handle: {e}")
        else:
            # Synchronous processing fallback
            logger.info(f"⚡ Synchronous processing for video {video.id}")
            try:
                from api.v1.upload_vercel import process_video_sync
                processed = await process_video_sync(video, s3_key, db, config)
                if processed:
                    logger.info(f"✅ Sync processing completed for video {video.id}")
            except Exception as e:
                logger.error(f"❌ Sync processing failed: {e}")
                # Keep as processing - recovery system will handle
        
        logger.info(f"✅ Direct upload successful: {video.id} ({file.filename})")
        
        return VideoResponse.from_orm(video)
        
    except Exception as e:
        logger.error(f"❌ Direct upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )