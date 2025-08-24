"""
Tâches Celery pour la récupération automatique des vidéos bloquées
"""

import logging
import asyncio
from datetime import datetime, timedelta
from celery import current_task
from celery.schedules import crontab
from sqlalchemy.orm import Session

from core.celery_app import celery_app
from core.database import get_db
from models.video import Video
from tasks.video_generation_v3 import generate_video_from_timeline_v3
from services.video_recovery_service import video_recovery_service

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def auto_recover_stuck_videos(self):
    """
    Tâche périodique pour récupérer automatiquement les vidéos bloquées
    Exécutée toutes les 2 minutes
    """
    try:
        logger.info("🔍 Vérification automatique des vidéos bloquées...")
        
        # Exécuter la vérification de manière synchrone
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(video_recovery_service.check_and_recover_stuck_videos())
        finally:
            loop.close()
        
        if result["stuck_videos_found"] > 0:
            logger.info(f"🎯 Auto-recovery: {result['recoveries_performed']}/{result['stuck_videos_found']} vidéos récupérées")
            
            if result.get("recovered_videos"):
                logger.info(f"📹 Vidéos relancées: {', '.join(result['recovered_videos'])}")
        else:
            logger.debug("✅ Auto-recovery: Aucune vidéo bloquée détectée")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Erreur dans auto_recover_stuck_videos: {e}")
        return {
            "status": "error",
            "error": str(e),
            "stuck_videos_found": 0,
            "recoveries_performed": 0
        }

@celery_app.task(bind=True)
def get_recovery_stats(self):
    """
    Retourne les statistiques du service de récupération automatique
    """
    try:
        return video_recovery_service.get_stats()
    except Exception as e:
        logger.error(f"❌ Erreur dans get_recovery_stats: {e}")
        return {"error": str(e)}

# Configuration des tâches périodiques
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Configuration des tâches périodiques"""
    
    # Vérification toutes les 2 minutes
    sender.add_periodic_task(
        120.0,  # 2 minutes
        auto_recover_stuck_videos.s(),
        name='auto-recover-stuck-videos-every-2min'
    )
    
    logger.info("🔄 Tâche périodique configurée: récupération automatique toutes les 2 minutes")

@celery_app.task(bind=True, name="video_recovery.check_stuck_videos")
def check_stuck_videos(self, timeout_minutes: int = 5, max_retries: int = 2):
    """
    Tâche spécifique pour détecter et relancer les vidéos bloquées
    Plus simple et robuste que le service complet
    """
    logger.info(f"🔍 Vérification vidéos bloquées (timeout: {timeout_minutes}min, max_retries: {max_retries})")
    
    db = next(get_db())
    try:
        # Trouver les vidéos bloquées
        timeout_threshold = datetime.utcnow() - timedelta(minutes=timeout_minutes)
        
        stuck_videos = db.query(Video).filter(
            Video.status == "processing",
            Video.updated_at < timeout_threshold,
            # Seulement les vidéos récentes (pas plus de 24h)
            Video.created_at > datetime.utcnow() - timedelta(hours=24)
        ).all()
        
        if not stuck_videos:
            logger.debug("✅ Aucune vidéo bloquée détectée")
            return {
                "status": "healthy",
                "stuck_videos": 0,
                "recovered": 0,
                "failed": 0,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        logger.warning(f"⚠️ {len(stuck_videos)} vidéo(s) bloquée(s) détectée(s)")
        
        recovered_count = 0
        failed_count = 0
        
        for video in stuck_videos:
            try:
                # Vérifier le nombre de tentatives dans source_data
                retry_count = 0
                if video.source_data and isinstance(video.source_data, dict):
                    retry_count = video.source_data.get('retry_count', 0)
                
                age_minutes = (datetime.utcnow() - video.updated_at).total_seconds() / 60
                
                logger.info(f"🔄 Vidéo bloquée: {video.title} (âge: {age_minutes:.1f}min, retry: {retry_count})")
                
                if retry_count < max_retries:
                    # Tenter de relancer
                    if retry_viral_video_generation(video, db):
                        recovered_count += 1
                        logger.info(f"✅ Vidéo {video.id} relancée")
                    else:
                        mark_video_as_failed(video, db, f"Échec de relance (tentative {retry_count + 1})")
                        failed_count += 1
                else:
                    # Trop de tentatives
                    mark_video_as_failed(video, db, f"Timeout définitif après {retry_count} tentatives")
                    failed_count += 1
                    
            except Exception as e:
                logger.error(f"❌ Erreur traitement vidéo {video.id}: {e}")
                mark_video_as_failed(video, db, f"Erreur de traitement: {str(e)}")
                failed_count += 1
        
        result = {
            "status": "completed",
            "stuck_videos": len(stuck_videos),
            "recovered": recovered_count,
            "failed": failed_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"🎯 Vérification terminée: {recovered_count} récupérées, {failed_count} échouées")
        return result
        
    except Exception as e:
        logger.error(f"❌ Erreur critique lors de la vérification: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()

def retry_viral_video_generation(video: Video, db: Session) -> bool:
    """
    Pour l'instant, on marque simplement les vidéos bloquées comme échouées
    pour permettre à l'utilisateur de relancer manuellement
    """
    try:
        logger.info(f"🔄 Marquage vidéo bloquée comme échouée: {video.id}")
        
        # Incrémenter retry count dans source_data 
        source_data = video.source_data or {}
        if isinstance(source_data, dict):
            source_data['retry_count'] = source_data.get('retry_count', 0) + 1
            source_data['last_retry_attempt'] = datetime.utcnow()
            video.source_data = source_data
        
        # Pour l'instant, on marque comme échouée pour permettre retry manuel
        video.status = "failed"
        video.updated_at = datetime.utcnow()
        
        # Ajouter la raison
        if isinstance(source_data, dict):
            source_data['failure_reason'] = "Vidéo bloquée en processing, marquée pour retry manuel"
            video.source_data = source_data
        
        db.commit()
        
        logger.info(f"✅ Vidéo {video.id} marquée échouée pour retry manuel")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur retry {video.id}: {e}")
        return False

def mark_video_as_failed(video: Video, db: Session, reason: str):
    """Marque une vidéo comme échouée"""
    video.status = "failed"
    video.updated_at = datetime.utcnow()
    
    # Ajouter la raison
    source_data = video.source_data or {}
    if isinstance(source_data, dict):
        source_data['failure_reason'] = reason
        source_data['failed_at'] = datetime.utcnow()
        video.source_data = source_data
    
    db.commit()
    logger.warning(f"❌ Vidéo {video.id} marquée échouée: {reason}")

@celery_app.task(bind=True, name="video_recovery.cleanup_old_failed_videos")
def cleanup_old_failed_videos(self, days_old: int = 7):
    """Nettoie les anciennes vidéos échouées"""
    logger.info(f"🧹 Nettoyage vidéos échouées > {days_old} jours")
    
    db = next(get_db())
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        old_failed = db.query(Video).filter(
            Video.status == "failed",
            Video.updated_at < cutoff_date
        ).all()
        
        if not old_failed:
            logger.info("✅ Rien à nettoyer")
            return {"status": "no_cleanup_needed", "deleted": 0}
        
        deleted = 0
        for video in old_failed:
            try:
                db.delete(video)
                deleted += 1
            except Exception as e:
                logger.error(f"❌ Erreur suppression {video.id}: {e}")
        
        db.commit()
        
        logger.info(f"🧹 {deleted} vidéos supprimées")
        return {"status": "completed", "deleted": deleted}
        
    finally:
        db.close()