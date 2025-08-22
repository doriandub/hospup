"""
Celery tasks for video analysis processing.

These tasks handle the computationally intensive video analysis workflow:
1. Scene detection and segmentation
2. AI-powered frame analysis
3. Vector embedding generation and storage
"""

import os
import tempfile
import logging
from typing import Optional

from celery import Celery
from services.video_analysis_service import video_analysis_service
from services.s3_service import s3_service
from core.config import settings

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery('hospup_video_analysis')
celery_app.config_from_object(settings, namespace='CELERY')

@celery_app.task(bind=True, max_retries=3)
def analyze_uploaded_video(self, video_id: str, s3_key: str):
    """
    Analyze an uploaded video asynchronously
    
    Args:
        video_id: Database ID of the video
        s3_key: S3 path to the video file
        
    This task:
    1. Downloads video from S3 to temporary file
    2. Runs scene detection and AI analysis
    3. Stores results in database and Weaviate
    4. Cleans up temporary files
    """
    temp_file_path = None
    
    try:
        logger.info(f"Starting video analysis task for video {video_id}")
        
        # Create temporary file for video
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_file:
            temp_file_path = temp_file.name
        
        # Download video from S3
        logger.info(f"Downloading video from S3: {s3_key}")
        success = _download_video_from_s3(s3_key, temp_file_path)
        
        if not success:
            raise Exception(f"Failed to download video from S3: {s3_key}")
        
        # Analyze video
        logger.info(f"Starting analysis of video file: {temp_file_path}")
        analysis_success = video_analysis_service.analyze_video(video_id, temp_file_path)
        
        if not analysis_success:
            raise Exception(f"Video analysis failed for video {video_id}")
        
        logger.info(f"Successfully completed analysis for video {video_id}")
        return {
            "status": "success",
            "video_id": video_id,
            "message": "Video analysis completed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error in video analysis task: {e}")
        
        # Retry logic
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying video analysis task (attempt {self.request.retries + 1})")
            raise self.retry(countdown=60, exc=e)
        else:
            logger.error(f"Max retries exceeded for video {video_id}")
            # Update video status to failed
            from services.video_analysis_service import VideoAnalysisService
            service = VideoAnalysisService()
            service._update_video_status(video_id, "analysis_failed")
            
            return {
                "status": "failed",
                "video_id": video_id,
                "error": str(e)
            }
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {e}")

def _download_video_from_s3(s3_key: str, local_path: str) -> bool:
    """
    Download video file from S3 to local path
    
    Args:
        s3_key: S3 object key
        local_path: Local file path to save to
        
    Returns:
        Success status
    """
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        # Download file
        s3_client.download_file(settings.AWS_S3_BUCKET, s3_key, local_path)
        
        # Verify file was downloaded
        if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
            logger.info(f"Successfully downloaded {s3_key} to {local_path}")
            return True
        else:
            logger.error(f"Downloaded file is empty or missing: {local_path}")
            return False
            
    except ClientError as e:
        logger.error(f"AWS S3 error downloading {s3_key}: {e}")
        return False
    except Exception as e:
        logger.error(f"Error downloading {s3_key}: {e}")
        return False

@celery_app.task
def analyze_viral_video_template(template_id: str, s3_key: str):
    """
    Analyze a viral video template for future matching
    
    This is used when you add viral videos to your reference database.
    The analysis results will be used to match against user-uploaded content.
    """
    try:
        logger.info(f"Analyzing viral video template {template_id}")
        
        # Similar process to regular video analysis
        # but mark segments as viral reference templates
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_file:
            temp_file_path = temp_file.name
        
        try:
            # Download and analyze
            if _download_video_from_s3(s3_key, temp_file_path):
                # Analyze with special marking for viral templates
                success = video_analysis_service.analyze_video(template_id, temp_file_path)
                
                if success:
                    # Mark all segments as viral reference
                    _mark_segments_as_viral_reference(template_id)
                    
                    logger.info(f"Successfully analyzed viral template {template_id}")
                    return {"status": "success", "template_id": template_id}
                else:
                    raise Exception("Analysis failed")
            else:
                raise Exception("Download failed")
                
        finally:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"Error analyzing viral template {template_id}: {e}")
        return {"status": "failed", "error": str(e)}

def _mark_segments_as_viral_reference(video_id: str):
    """Mark video segments as viral reference templates"""
    try:
        from core.database import SessionLocal
        from models.video_segment import VideoSegment
        
        db = SessionLocal()
        
        # Update all segments for this video
        segments = db.query(VideoSegment).filter(VideoSegment.video_id == video_id).all()
        
        for segment in segments:
            # Update Weaviate object to mark as viral reference
            from services.weaviate_service import weaviate_service
            if segment.embedding_id:
                # Update the object in Weaviate with viral reference flag
                weaviate_service.client.data_object.update(
                    uuid=segment.embedding_id,
                    class_name="VideoSegment",
                    data_object={"is_viral_reference": True}
                )
        
        db.close()
        logger.info(f"Marked {len(segments)} segments as viral reference for video {video_id}")
        
    except Exception as e:
        logger.error(f"Error marking viral reference segments: {e}")

@celery_app.task
def cleanup_deleted_video_analysis(video_id: str):
    """
    Clean up analysis data when a video is deleted
    
    Args:
        video_id: ID of deleted video
    """
    try:
        logger.info(f"Cleaning up analysis data for deleted video {video_id}")
        
        # Delete from Weaviate
        from services.weaviate_service import weaviate_service
        weaviate_service.delete_video_segments(video_id)
        
        # Database cleanup is handled by cascade delete in the model
        
        logger.info(f"Successfully cleaned up analysis data for video {video_id}")
        return {"status": "success", "video_id": video_id}
        
    except Exception as e:
        logger.error(f"Error cleaning up video analysis data: {e}")
        return {"status": "failed", "error": str(e)}

# Task routing configuration
celery_app.conf.task_routes = {
    'tasks.video_analysis_tasks.analyze_uploaded_video': {'queue': 'video_analysis'},
    'tasks.video_analysis_tasks.analyze_viral_video_template': {'queue': 'video_analysis'},
    'tasks.video_analysis_tasks.cleanup_deleted_video_analysis': {'queue': 'cleanup'},
}