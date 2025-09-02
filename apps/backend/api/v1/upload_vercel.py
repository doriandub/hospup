"""
Version Vercel-compatible de l'API upload - traitement synchrone des vidéos
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from core.database import get_db
from models.video import Video
from models.property import Property
from models.user import User
from api.dependencies.auth import get_current_user
# Import services conditionally to prevent startup crashes
try:
    from services.s3_service import s3_service
except Exception as e:
    print(f"Warning: Could not import S3 service: {e}")
    s3_service = None

try:
    from services.video_conversion_service import video_conversion_service
except Exception as e:
    print(f"Warning: Could not import video conversion service: {e}")
    video_conversion_service = None

try:
    from services.openai_vision_service import openai_vision_service
    ai_analysis_service = openai_vision_service
    logger.info("✅ Using OpenAI Vision API for video analysis")
except Exception as e:
    print(f"Warning: Could not import OpenAI Vision service: {e}")  
    ai_analysis_service = None
from core.config import settings
from schemas.video import VideoResponse, VideoCreateRequest, UploadUrlRequest, UploadUrlResponse
import logging
import tempfile
import os
import json
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter()

async def process_video_sync(video: Video, s3_key: str, db: Session, config: dict) -> bool:
    """
    Process video synchronously (Vercel-compatible)
    Returns True if successful, False if partial success, raises Exception if failed
    """
    
    try:
        logger.info(f"🎬 Processing video synchronously: {video.title}")
        
        # Check services availability and log warnings (graceful degradation)
        services_available = {
            "s3": s3_service is not None,
            "video_conversion": video_conversion_service is not None, 
            "ai_analysis": ai_analysis_service is not None
        }
        
        if not services_available["s3"]:
            logger.error("❌ S3 service not available - check AWS credentials")
            video.status = "failed"
            video.description = f"{video.description}\n\nFailed: S3 service not available"
            db.commit()
            raise Exception("S3 service required for video processing")
            
        if not services_available["video_conversion"]:
            logger.warning("⚠️ Video conversion service not available - skipping FFmpeg operations")
            
        if not services_available["ai_analysis"]:
            logger.warning("⚠️ OpenAI Vision service not available - skipping AI description")
        
        # Download video from S3
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download original video
            original_path = os.path.join(temp_dir, f"original_{video.id}.mp4")
            
            if settings.STORAGE_BACKEND == "s3":
                s3_service.download_file(s3_key, original_path)
            else:
                # For local storage, copy file
                local_path = os.path.join("uploads", s3_key)
                import shutil
                shutil.copy2(local_path, original_path)
            
            # Get video metadata (with FFmpeg check)
            if services_available["video_conversion"]:
                try:
                    metadata = video_conversion_service.get_video_metadata(original_path)
                    logger.info(f"✅ Video metadata extracted: {metadata}")
                except Exception as e:
                    logger.warning(f"⚠️ Metadata extraction failed (FFmpeg issue?): {e}")
                    metadata = {"duration": 30.0, "width": 1080, "height": 1920, "fps": 30}
            else:
                # Default metadata when FFmpeg not available
                logger.info("ℹ️ Using default metadata (no FFmpeg)")
                metadata = {"duration": 30.0, "width": 1080, "height": 1920, "fps": 30}
            
            # Check if conversion is needed and FFmpeg is available
            needs_conversion = False
            final_video_path = original_path
            
            # Test FFmpeg availability
            ffmpeg_available = False
            try:
                import subprocess
                result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True, timeout=5)
                ffmpeg_available = result.returncode == 0
                logger.info("✅ FFmpeg is available for conversion")
            except Exception as e:
                logger.warning(f"⚠️ FFmpeg not available: {e}")
                ffmpeg_available = False
            
            if ffmpeg_available:
                try:
                    needs_conversion = video_conversion_service.needs_conversion(metadata)
                    
                    if needs_conversion:
                        logger.info("📐 Video needs conversion - converting...")
                        converted_path = os.path.join(temp_dir, f"converted_{video.id}.mp4")
                        
                        conversion_result = video_conversion_service.convert_video(
                            original_path, 
                            converted_path,
                            target_resolution="1080x1920",
                            target_fps=30,
                            timeout=config["processing_timeout"]["video_conversion"]
                        )
                        
                        if conversion_result.get("success"):
                            final_video_path = converted_path
                            logger.info("✅ Video converted successfully")
                        else:
                            logger.warning("⚠️ Conversion failed, using original")
                except Exception as e:
                    logger.warning(f"⚠️ Video conversion failed: {e}")
            else:
                logger.warning("🚫 Skipping video conversion - FFmpeg not available")
            
            # Generate AI description with OpenAI Vision
            content_description = "Video uploaded successfully"
            if services_available["ai_analysis"] and config["enable_ai_description"]:
                try:
                    logger.info("📝 Generating AI description with OpenAI Vision...")
                    content_description = ai_analysis_service.analyze_video_content(
                        final_video_path,
                        max_frames=config["max_frames_for_ai"],
                        timeout=config["processing_timeout"]["ai_analysis"]
                    )
                    logger.info(f"✅ AI description generated: {content_description[:100]}...")
                except Exception as e:
                    logger.warning(f"⚠️ AI description failed: {e}")
                    content_description = "Video uploaded successfully - AI analysis failed"
            else:
                if not services_available["ai_analysis"]:
                    logger.info("ℹ️ Skipping AI analysis - OpenAI Vision not configured")
                    content_description = "Video uploaded successfully - AI analysis unavailable (OpenAI key missing)"
            
            # Upload processed video if converted
            final_s3_key = s3_key
            if needs_conversion and ffmpeg_available:
                # Upload converted video
                base_key = s3_key.rsplit('.', 1)[0]
                final_s3_key = f"{base_key}_processed.mp4"
                
                if settings.STORAGE_BACKEND == "s3":
                    with open(final_video_path, 'rb') as video_file:
                        upload_result = s3_service.upload_file_direct(
                            video_file, 
                            final_s3_key, 
                            content_type="video/mp4",
                            public_read=False
                        )
                    
                    if upload_result.get("success"):
                        # Delete original to save space
                        s3_service.delete_file(s3_key)
                        logger.info("✅ Processed video uploaded, original deleted")
                else:
                    # Local storage
                    final_local_path = os.path.join("uploads", final_s3_key)
                    os.makedirs(os.path.dirname(final_local_path), exist_ok=True)
                    import shutil
                    shutil.copy2(final_video_path, final_local_path)
                    
                    # Remove original
                    original_local_path = os.path.join("uploads", s3_key)
                    if os.path.exists(original_local_path):
                        os.remove(original_local_path)
            
            # Generate thumbnail (quick version) - only if FFmpeg available
            thumbnail_url = None
            try:
                if config["enable_thumbnail_generation"] and ffmpeg_available:
                    logger.info("📸 Generating thumbnail with FFmpeg...")
                    thumbnail_path = os.path.join(temp_dir, f"thumb_{video.id}.jpg")
                    
                    # Generate thumbnail at 2 second mark
                    import subprocess
                    result = subprocess.run([
                        'ffmpeg', '-i', final_video_path, '-ss', '2', '-vframes', '1',
                        '-q:v', '2', '-y', thumbnail_path
                    ], capture_output=True, text=True, timeout=config["processing_timeout"]["thumbnail_generation"])
                    
                    if result.returncode == 0 and os.path.exists(thumbnail_path):
                        # Upload thumbnail
                        thumb_key = f"thumbnails/{video.id}.jpg"
                        
                        if settings.STORAGE_BACKEND == "s3":
                            with open(thumbnail_path, 'rb') as thumb_file:
                                thumb_result = s3_service.upload_file_direct(
                                    thumb_file, thumb_key, content_type="image/jpeg", public_read=True
                                )
                            if thumb_result.get("success"):
                                thumbnail_url = f"s3://{s3_service.bucket_name}/{thumb_key}"
                        else:
                            # Local storage
                            thumb_local_path = os.path.join("uploads", thumb_key)
                            os.makedirs(os.path.dirname(thumb_local_path), exist_ok=True)
                            import shutil
                            shutil.copy2(thumbnail_path, thumb_local_path)
                            thumbnail_url = f"s3://hospup-files/{thumb_key}"
                        
                        logger.info("✅ Thumbnail generated")
                elif config["enable_thumbnail_generation"] and not ffmpeg_available:
                    logger.warning("🚫 Skipping thumbnail generation - FFmpeg not available")
                
            except Exception as e:
                logger.warning(f"⚠️ Thumbnail generation failed: {e}")
            
            # Update video record with final information
            try:
                final_metadata = video_conversion_service.get_video_metadata(final_video_path) if ffmpeg_available else metadata
            except Exception as e:
                logger.warning(f"⚠️ Final metadata extraction failed: {e}")
                final_metadata = metadata
            
            # Update video with processed information
            if settings.STORAGE_BACKEND == "s3":
                video.video_url = f"s3://{s3_service.bucket_name}/{final_s3_key}"
            else:
                video.video_url = f"s3://hospup-files/{final_s3_key}"
            
            video.duration = final_metadata.get("duration")
            video.size = final_metadata.get("size", os.path.getsize(final_video_path))
            video.format = "mp4"
            video.description = f"{video.description}\n\nAI Analysis: {content_description}"
            
            if thumbnail_url:
                video.thumbnail_url = thumbnail_url
            
            # Set final status to completed (as expected by frontend)
            video.status = "completed"  # Processing completed successfully
            video.completed_at = datetime.utcnow()  # Mark completion time
            
            # Store processing metadata
            processing_metadata = {
                "processed_at": datetime.utcnow().isoformat(),
                "conversion_needed": needs_conversion,
                "content_description": content_description,
                "processing_mode": f"synchronous_{config['mode']}",
                "final_s3_key": final_s3_key
            }
            
            video.source_data = json.dumps(processing_metadata)
            
            db.commit()
            db.refresh(video)
            
            logger.info(f"✅ Video processing completed synchronously: {video.id}")
            
            return True
            
    except Exception as e:
        logger.error(f"❌ Synchronous processing failed: {e}")
        raise e

@router.post("/complete", response_model=VideoResponse)
async def complete_upload_vercel(
    request: VideoCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a video record and process it synchronously (Vercel-compatible)
    """
    
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
    
    # Create video record initially as processing
    video = Video(
        title=request.file_name,
        video_url=f"s3://{s3_service.bucket_name}/{request.s3_key}",
        format=request.content_type.split('/')[-1],
        size=request.file_size,
        status="processing",
        user_id=current_user.id,
        property_id=request.property_id,
        description=f"Uploaded video: {request.file_name}"
    )
    
    db.add(video)
    db.commit()
    db.refresh(video)
    
    # Process video synchronously (instead of async with Celery)
    try:
        logger.info(f"🎬 Processing video synchronously: {video.title}")
        
        # Download video from S3
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download original video
            original_path = os.path.join(temp_dir, f"original_{video.id}.mp4")
            
            if settings.STORAGE_BACKEND == "s3":
                s3_service.download_file(request.s3_key, original_path)
            else:
                # For local storage, copy file
                local_path = os.path.join("uploads", request.s3_key)
                import shutil
                shutil.copy2(local_path, original_path)
            
            # Get video metadata
            metadata = video_conversion_service.get_video_metadata(original_path)
            
            # Check if conversion is needed
            needs_conversion = video_conversion_service.needs_conversion(metadata)
            final_video_path = original_path
            
            if needs_conversion:
                logger.info("📐 Video needs conversion - converting...")
                converted_path = os.path.join(temp_dir, f"converted_{video.id}.mp4")
                
                conversion_result = video_conversion_service.convert_video(
                    original_path, 
                    converted_path,
                    target_resolution="1080x1920",
                    target_fps=30
                )
                
                if conversion_result.get("success"):
                    final_video_path = converted_path
                    logger.info("✅ Video converted successfully")
                else:
                    logger.warning("⚠️ Conversion failed, using original")
            
            # Generate AI description (with timeout for Vercel) - if AI analysis available
            content_description = "Video uploaded successfully"
            if services_available["ai_analysis"]:
                try:
                    logger.info("📝 Generating AI description...")
                    content_description = ai_analysis_service.analyze_video_content(
                        final_video_path,
                        max_frames=5,  # Reduced for faster processing
                        timeout=30     # 30 second timeout for Vercel
                    )
                except Exception as e:
                    logger.warning(f"⚠️ AI description failed: {e}")
                    content_description = "Video uploaded successfully - AI analysis failed"
            else:
                logger.info("ℹ️ Skipping AI description - BLIP service not available")
                content_description = "Video uploaded successfully - AI analysis unavailable"
            
            
            # Upload processed video if converted
            final_s3_key = request.s3_key
            if needs_conversion:
                # Upload converted video
                base_key = request.s3_key.rsplit('.', 1)[0]
                final_s3_key = f"{base_key}_processed.mp4"
                
                if settings.STORAGE_BACKEND == "s3":
                    with open(final_video_path, 'rb') as video_file:
                        upload_result = s3_service.upload_file_direct(
                            video_file, 
                            final_s3_key, 
                            content_type="video/mp4",
                            public_read=False
                        )
                    
                    if upload_result.get("success"):
                        # Delete original to save space
                        s3_service.delete_file(request.s3_key)
                        logger.info("✅ Processed video uploaded, original deleted")
                else:
                    # Local storage
                    final_local_path = os.path.join("uploads", final_s3_key)
                    os.makedirs(os.path.dirname(final_local_path), exist_ok=True)
                    shutil.copy2(final_video_path, final_local_path)
                    
                    # Remove original
                    original_local_path = os.path.join("uploads", request.s3_key)
                    if os.path.exists(original_local_path):
                        os.remove(original_local_path)
            
            # Generate thumbnail (quick version for Vercel)
            thumbnail_url = None
            try:
                logger.info("📸 Generating thumbnail...")
                thumbnail_path = os.path.join(temp_dir, f"thumb_{video.id}.jpg")
                
                # Generate thumbnail at 2 second mark
                import subprocess
                result = subprocess.run([
                    'ffmpeg', '-i', final_video_path, '-ss', '2', '-vframes', '1',
                    '-q:v', '2', '-y', thumbnail_path
                ], capture_output=True, text=True, timeout=15)
                
                if result.returncode == 0 and os.path.exists(thumbnail_path):
                    # Upload thumbnail
                    thumb_key = f"thumbnails/{video.id}.jpg"
                    
                    if settings.STORAGE_BACKEND == "s3":
                        with open(thumbnail_path, 'rb') as thumb_file:
                            thumb_result = s3_service.upload_file_direct(
                                thumb_file, thumb_key, content_type="image/jpeg", public_read=True
                            )
                        if thumb_result.get("success"):
                            thumbnail_url = f"s3://{s3_service.bucket_name}/{thumb_key}"
                    else:
                        # Local storage
                        thumb_local_path = os.path.join("uploads", thumb_key)
                        os.makedirs(os.path.dirname(thumb_local_path), exist_ok=True)
                        shutil.copy2(thumbnail_path, thumb_local_path)
                        thumbnail_url = f"s3://hospup-files/{thumb_key}"
                    
                    logger.info("✅ Thumbnail generated")
                
            except Exception as e:
                logger.warning(f"Thumbnail generation failed: {e}")
            
            # Update video record with final information
            final_metadata = video_conversion_service.get_video_metadata(final_video_path)
            
            # Update video with processed information
            if settings.STORAGE_BACKEND == "s3":
                video.video_url = f"s3://{s3_service.bucket_name}/{final_s3_key}"
            else:
                video.video_url = f"s3://hospup-files/{final_s3_key}"
            
            video.duration = final_metadata.get("duration")
            video.size = final_metadata.get("size", os.path.getsize(final_video_path))
            video.format = "mp4"
            video.description = f"{video.description}\n\nAI Analysis: {content_description}"
            
            if thumbnail_url:
                video.thumbnail_url = thumbnail_url
            
            # Set final status to completed (as expected by frontend)
            video.status = "completed"  # Processing completed successfully
            video.completed_at = datetime.utcnow()  # Mark completion time
            
            # Store processing metadata
            processing_metadata = {
                "processed_at": datetime.utcnow().isoformat(),
                "conversion_needed": needs_conversion,
                "content_description": content_description,
                "processing_mode": "synchronous_vercel",
                "final_s3_key": final_s3_key
            }
            
            video.source_data = json.dumps(processing_metadata)
            
            db.commit()
            db.refresh(video)
            
            logger.info(f"✅ Video processing completed synchronously: {video.id}")
            
            return VideoResponse.from_orm(video)
            
    except Exception as e:
        logger.error(f"❌ Synchronous processing failed: {e}")
        
        # Update video status to failed
        video.status = "failed"
        video.description = f"{video.description}\n\nProcessing failed: {str(e)}"
        db.commit()
        
        # Still return the video record
        return VideoResponse.from_orm(video)

# Keep the original async endpoint for local development
@router.post("/complete-async", response_model=VideoResponse)
async def complete_upload_async(
    request: VideoCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a video record with async processing (for local development with Celery)
    """
    
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
    
    # Create video record with processing status
    video = Video(
        title=request.file_name,
        video_url=f"s3://{s3_service.bucket_name}/{request.s3_key}",
        format=request.content_type.split('/')[-1],
        size=request.file_size,
        status="processing",
        user_id=current_user.id,
        property_id=request.property_id,
        description=f"Uploaded video: {request.file_name}"
    )
    
    db.add(video)
    db.commit()
    db.refresh(video)
    
    # Trigger background processing with Celery (for local dev)
    try:
        from tasks.video_processing_tasks import process_uploaded_video
        task = process_uploaded_video.delay(str(video.id), request.s3_key)
        
        video.generation_job_id = task.id
        db.commit()
        
        logger.info(f"Started async processing task {task.id} for video {video.id}")
        
    except Exception as e:
        logger.warning(f"Async processing unavailable (Celery not running): {e}")
        # Video stays in processing status - will be handled by recovery system
    
    return VideoResponse.from_orm(video)