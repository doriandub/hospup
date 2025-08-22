"""
Tâches Celery pour la récupération automatique des vidéos bloquées
"""

from celery import current_task
from celery.schedules import crontab
from core.celery_app import celery_app
from services.video_recovery_service import video_recovery_service
import logging
import asyncio

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