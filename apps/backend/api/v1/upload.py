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
# Import S3 service conditionally to prevent startup crashes
try:
    from services.s3_service import s3_service
except Exception as e:
    print(f"Warning: Could not import S3 service: {e}")
    s3_service = None
from core.config import settings
# Import Celery tasks conditionally to prevent startup crashes
try:
    from tasks.video_processing_tasks import get_video_processing_status
except Exception as e:
    print(f"Warning: Could not import video processing tasks: {e}")
    get_video_processing_status = None

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
        # Check if S3 service is available
        if not s3_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 service unavailable"
            )
        
        # Use S3 service for presigned URL generation
        upload_data = s3_service.generate_presigned_upload_url(
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
    
    try:
        logger.info(f"Getting download URL for s3_key: {s3_key}")
        
        # Check if user has access to any video with this S3 key
        # Construct the full S3 URL to search for
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
        
        # Check if S3 service is available
        if not s3_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 service unavailable"
            )
        
        # Use S3 service for presigned download URL
        download_url = s3_service.generate_presigned_download_url(s3_key)
        
        logger.info(f"Generated download URL successfully for s3_key: {s3_key}")
        return {"download_url": download_url}
        
    except Exception as e:
        logger.error(f"Failed to generate download URL for s3_key: {s3_key}, error: {e}")
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
    
    # Check if S3 service is available
    if not s3_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3 service unavailable"
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
        # Check if video processing tasks are available
        if not get_video_processing_status:
            return {
                "video_id": video_id,
                "status": video.status,
                "message": "Processing status tracking unavailable"
            }
        
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

# Direct upload endpoint - handles both / and without trailing slash
@router.post("/", response_model=VideoResponse)
@router.post("", response_model=VideoResponse)  
async def upload_video_direct(
    file: UploadFile = File(...),
    property_id: str = Form(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Direct video upload endpoint - scalable version
    Upload via backend → Stream to S3 → Process automatically → Optimize
    Scalable car pas de stockage local + traitement async
    """
    
    logger.info(f"🎬 Direct upload started: {file.filename} for user {current_user.id}")
    
    # Property is required - user must create one first
    
    # Validate property ownership
    property = db.query(Property).filter(
        Property.id == property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found or you don't have access to it."
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
        import uuid
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        s3_key = f"properties/{property_id}/videos/{unique_filename}"
        
        # Stream directly to S3 (production scalable storage)
        logger.info(f"☁️ Streaming to S3: {s3_key}")
        
        # Reset file pointer to beginning
        await file.seek(0)
        
        # Check if S3 is configured and available
        if s3_service and settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            # Production S3 upload
            upload_result = s3_service.upload_file_direct(
                file.file,  # Direct file stream
                s3_key, 
                file.content_type or 'video/mp4'
            )
            
            if not upload_result['success']:
                raise Exception(f"S3 upload failed: {upload_result.get('error')}")
            
            video_url = f"s3://{s3_service.bucket_name}/{s3_key}"
            logger.info(f"✅ S3 upload successful: {video_url}")
        else:
            # Development/Testing mode - simulate S3 upload
            if not s3_service:
                logger.warning("⚠️ S3 service unavailable, using test mode")
            else:
                logger.warning("⚠️ S3 credentials not configured, using test mode")
            video_url = f"test://uploads/{s3_key}"
            logger.info(f"✅ TEST upload simulated: {video_url}")
        
        # Get file size
        file_size = 0
        try:
            await file.seek(0, 2)  # Seek to end
            file_size = await file.tell()
            await file.seek(0)     # Reset to beginning
        except:
            file_size = 1024 * 1024  # Default 1MB
        
        # Create video record with "processing" status
        # This will trigger the automatic processing pipeline
        video = Video(
            title=title or file.filename,
            video_url=video_url,
            format=file_extension,
            size=file_size,
            status="processing",  # Key: starts as processing, will be auto-processed
            user_id=current_user.id,
            property_id=property_id,
            description=f"Uploaded video: {file.filename}"
        )
        
        db.add(video)
        db.commit()
        db.refresh(video)
        
        # Trigger automatic video processing
        logger.info(f"🚀 Triggering video processing for {video.id}")
        
        # Auto-detect environment and choose appropriate processing method
        from core.deployment import deployment_config
        config = deployment_config.get_processing_config()
        
        if config["use_async_processing"]:
            # Celery async processing (recommended for production)
            try:
                from tasks.video_processing_tasks import process_uploaded_video
                task = process_uploaded_video.delay(str(video.id), s3_key)
                video.generation_job_id = task.id
                db.commit()
                logger.info(f"🔄 Async processing task {task.id} started for video {video.id}")
            except Exception as e:
                logger.warning(f"❌ Async processing failed, video will remain as processing: {e}")
        else:
            # Vercel/Production sans Celery - traitement synchrone
            logger.info(f"🚀 Processing video synchronously (mode: {config['mode']})")
            
            try:
                # Import the synchronous processing function conditionally
                try:
                    from api.v1.upload_vercel import process_video_sync
                except Exception as import_error:
                    logger.warning(f"Could not import synchronous processing: {import_error}")
                    video.status = "uploaded" 
                    db.commit()
                    return VideoResponse.from_orm(video)
                
                # Process synchronously with timeout
                processed = await process_video_sync(
                    video=video,
                    s3_key=s3_key,
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
        
        logger.info(f"✅ Direct upload successful: {video.id} ({file.filename})")
        
        return VideoResponse.from_orm(video)
        
    except Exception as e:
        logger.error(f"❌ Direct upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )