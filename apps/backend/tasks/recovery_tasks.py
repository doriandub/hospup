from celery import current_task
from core.celery_app import celery_app
from core.database import get_db
from models.video import Video
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def recover_stuck_videos(self):
    """
    Recovery task to handle videos stuck in processing state
    Should be run periodically (e.g., every 5 minutes)
    """
    try:
        db = next(get_db())
        
        # Find videos stuck in processing for more than 10 minutes
        cutoff_time = datetime.utcnow() - timedelta(minutes=10)
        
        stuck_videos = db.query(Video).filter(
            Video.status == "processing",
            Video.created_at < cutoff_time
        ).all()
        
        if not stuck_videos:
            logger.info("✅ No stuck videos found")
            return {"recovered": 0, "message": "No stuck videos found"}
        
        recovered_count = 0
        
        for video in stuck_videos:
            try:
                # Check if it's an uploaded video (no viral_video_id) or generated video
                if video.viral_video_id is None:
                    # This is an uploaded video - mark as uploaded
                    video.status = "uploaded"
                    video.description = f"Auto-recovered from processing state at {datetime.utcnow().isoformat()}"
                    recovered_count += 1
                    logger.info(f"🔧 Recovered uploaded video: {video.id}")
                else:
                    # This is a generated video - mark as failed
                    video.status = "failed"
                    video.description = f"Auto-failed after timeout at {datetime.utcnow().isoformat()}"
                    recovered_count += 1
                    logger.info(f"🔧 Marked stuck generated video as failed: {video.id}")
                
            except Exception as e:
                logger.error(f"❌ Failed to recover video {video.id}: {e}")
                continue
        
        if recovered_count > 0:
            db.commit()
            logger.info(f"✅ Successfully recovered {recovered_count} stuck videos")
        
        return {
            "recovered": recovered_count,
            "message": f"Successfully recovered {recovered_count} stuck videos"
        }
        
    except Exception as e:
        logger.error(f"❌ Recovery task failed: {e}")
        return {"error": str(e)}
    finally:
        if 'db' in locals():
            db.close()

@celery_app.task(bind=True)
def cleanup_failed_generations(self):
    """
    Cleanup task to remove old failed video generation attempts
    Should be run daily
    """
    try:
        db = next(get_db())
        
        # Find failed videos older than 24 hours
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        failed_videos = db.query(Video).filter(
            Video.status == "failed",
            Video.viral_video_id.isnot(None),  # Only generated videos
            Video.created_at < cutoff_time
        ).all()
        
        if not failed_videos:
            logger.info("✅ No old failed videos to cleanup")
            return {"cleaned": 0, "message": "No old failed videos to cleanup"}
        
        cleaned_count = 0
        
        for video in failed_videos:
            try:
                db.delete(video)
                cleaned_count += 1
                logger.info(f"🧹 Cleaned up failed video: {video.id}")
                
            except Exception as e:
                logger.error(f"❌ Failed to cleanup video {video.id}: {e}")
                continue
        
        if cleaned_count > 0:
            db.commit()
            logger.info(f"✅ Successfully cleaned up {cleaned_count} failed videos")
        
        return {
            "cleaned": cleaned_count,
            "message": f"Successfully cleaned up {cleaned_count} failed videos"
        }
        
    except Exception as e:
        logger.error(f"❌ Cleanup task failed: {e}")
        return {"error": str(e)}
    finally:
        if 'db' in locals():
            db.close()