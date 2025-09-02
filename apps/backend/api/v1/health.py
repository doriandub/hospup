from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.celery_app import celery_app
from models.video import Video
from services.video_recovery_service import video_recovery_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
async def health_check():
    """
    Endpoint de vérification de santé basique pour Railway
    Vérifie seulement que l'application FastAPI répond
    """
    return {
        "status": "healthy",
        "service": "hospup-backend", 
        "message": "Backend is running"
    }

@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """
    Endpoint de vérification de santé détaillé
    Vérifie que tous les composants critiques fonctionnent
    """
    health_status = {
        "status": "healthy",
        "database": "unknown",
        "celery_worker": "unknown", 
        "video_processing": "unknown",
        "issues": []
    }
    
    # Test de la base de données
    try:
        video_count = db.query(Video).count()
        health_status["database"] = "healthy"
        logger.info(f"✅ Database healthy - {video_count} videos in database")
    except Exception as e:
        health_status["database"] = "error"
        health_status["issues"].append(f"Database error: {str(e)}")
        health_status["status"] = "unhealthy"
        logger.error(f"❌ Database error: {e}")
    
    # Test du worker Celery
    try:
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        
        if active_workers and any(active_workers.values()):
            health_status["celery_worker"] = "healthy"
            worker_count = len([w for workers in active_workers.values() for w in workers])
            logger.info(f"✅ Celery healthy - {worker_count} active tasks")
        else:
            health_status["celery_worker"] = "no_workers"
            health_status["issues"].append("No active Celery workers found")
            health_status["status"] = "degraded"
            logger.warning("⚠️ No active Celery workers")
            
    except Exception as e:
        health_status["celery_worker"] = "error"
        health_status["issues"].append(f"Celery error: {str(e)}")
        health_status["status"] = "unhealthy" 
        logger.error(f"❌ Celery error: {e}")
    
    # Test du processing vidéo
    try:
        from datetime import datetime, timedelta
        ten_minutes_ago = datetime.utcnow() - timedelta(minutes=10)
        
        stuck_videos = db.query(Video).filter(
            Video.status == "processing",
            Video.created_at < ten_minutes_ago
        ).count()
        
        processing_videos = db.query(Video).filter(Video.status == "processing").count()
        
        if stuck_videos > 0:
            health_status["video_processing"] = "stuck_videos"
            health_status["issues"].append(f"{stuck_videos} videos stuck in processing for >10min")
            health_status["status"] = "degraded"
            logger.warning(f"⚠️ {stuck_videos} stuck videos")
        elif processing_videos > 0:
            health_status["video_processing"] = f"processing_{processing_videos}_videos"
            logger.info(f"🔄 {processing_videos} videos currently processing")
        else:
            health_status["video_processing"] = "healthy"
            logger.info("✅ Video processing healthy")
            
    except Exception as e:
        health_status["video_processing"] = "error"
        health_status["issues"].append(f"Video processing check error: {str(e)}")
        logger.error(f"❌ Video processing check error: {e}")
    
    return health_status

@router.get("/video-processing-stats")
async def video_processing_stats(db: Session = Depends(get_db)):
    """
    Statistiques détaillées sur le processing vidéo
    """
    try:
        stats = {}
        
        # Compter par statut
        from sqlalchemy import func
        status_counts = db.query(
            Video.status, 
            func.count(Video.id)
        ).group_by(Video.status).all()
        
        stats["by_status"] = {status: count for status, count in status_counts}
        
        # Vidéos récemment uploadées (dernières 24h)
        from datetime import datetime, timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        
        recent_videos = db.query(Video).filter(
            Video.created_at >= yesterday
        ).count()
        stats["recent_uploads_24h"] = recent_videos
        
        # Vidéos en processing avec durée
        processing_videos = db.query(Video).filter(
            Video.status == "processing"
        ).all()
        
        stats["currently_processing"] = []
        for video in processing_videos:
            processing_duration = (datetime.utcnow() - video.created_at).total_seconds()
            stats["currently_processing"].append({
                "id": video.id,
                "title": video.title,
                "processing_duration_minutes": round(processing_duration / 60, 1),
                "task_id": video.generation_job_id
            })
        
        # Stats Celery
        try:
            inspect = celery_app.control.inspect()
            active_tasks = inspect.active()
            
            if active_tasks:
                total_active_tasks = sum(len(tasks) for tasks in active_tasks.values())
                stats["celery_active_tasks"] = total_active_tasks
                
                # Détail des tâches actives
                video_processing_tasks = 0
                for worker, tasks in active_tasks.items():
                    for task in tasks:
                        if "process_uploaded_video" in task.get("name", ""):
                            video_processing_tasks += 1
                
                stats["active_video_processing_tasks"] = video_processing_tasks
            else:
                stats["celery_active_tasks"] = 0
                stats["active_video_processing_tasks"] = 0
                
        except Exception as e:
            stats["celery_error"] = str(e)
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting video processing stats: {e}")
        return {"error": str(e)}

@router.get("/auto-recovery-stats")
async def auto_recovery_stats():
    """
    Statistiques du système de récupération automatique
    """
    try:
        return video_recovery_service.get_stats()
    except Exception as e:
        logger.error(f"Error getting auto recovery stats: {e}")
        return {"error": str(e)}

@router.post("/trigger-recovery")
async def trigger_manual_recovery():
    """
    Déclenche manuellement une vérification et récupération des vidéos bloquées
    """
    try:
        logger.info("🔧 Déclenchement manuel de la récupération des vidéos")
        result = await video_recovery_service.check_and_recover_stuck_videos()
        return {
            "triggered": True,
            "result": result,
            "message": f"Récupération terminée: {result.get('recoveries_performed', 0)} vidéos relancées"
        }
    except Exception as e:
        logger.error(f"Error triggering manual recovery: {e}")
        return {"error": str(e), "triggered": False}