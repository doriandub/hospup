"""
API endpoints pour la récupération automatique des vidéos bloquées
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from core.auth import get_current_user
from models.user import User
from tasks.video_recovery_tasks import check_stuck_videos

router = APIRouter(prefix="/api/v1/video-recovery", tags=["Video Recovery"])
logger = logging.getLogger(__name__)

@router.get("/status", response_model=Dict[str, Any])
async def get_recovery_status(
    current_user: User = Depends(get_current_user)
):
    """
    Obtenir le statut du système de récupération automatique
    """
    try:
        # Exécuter une vérification rapide
        result = check_stuck_videos(timeout_minutes=5, max_retries=2)
        
        return {
            "status": "active",
            "last_check": datetime.utcnow().isoformat(),
            "recovery_system": "enabled",
            "last_scan_result": result,
            "configuration": {
                "timeout_minutes": 5,
                "max_retries": 2,
                "scan_interval": "Every 3 minutes (via Celery Beat)"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Erreur statut récupération: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur système de récupération: {str(e)}"
        )

@router.post("/manual-scan", response_model=Dict[str, Any])
async def manual_recovery_scan(
    timeout_minutes: Optional[int] = 5,
    max_retries: Optional[int] = 2,
    current_user: User = Depends(get_current_user)
):
    """
    Déclencher manuellement une vérification des vidéos bloquées
    """
    try:
        logger.info(f"🔍 Scan manuel lancé par {current_user.email}")
        
        # Exécuter la vérification
        result = check_stuck_videos(
            timeout_minutes=timeout_minutes, 
            max_retries=max_retries
        )
        
        # Ajouter des infos sur l'utilisateur
        result["triggered_by"] = current_user.email
        result["triggered_at"] = datetime.utcnow().isoformat()
        result["parameters"] = {
            "timeout_minutes": timeout_minutes,
            "max_retries": max_retries
        }
        
        # Log du résultat
        if result["stuck_videos"] > 0:
            logger.info(f"📋 Scan manuel: {result['recovered']} récupérées, {result['failed']} échouées")
        else:
            logger.info("✅ Scan manuel: aucune vidéo bloquée")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Erreur scan manuel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du scan manuel: {str(e)}"
        )

@router.get("/health", response_model=Dict[str, Any])
async def recovery_health_check():
    """
    Health check rapide du système de récupération (sans auth)
    """
    try:
        # Test très rapide - juste compter les vidéos en processing
        from core.database import get_db
        from models.video import Video
        from datetime import timedelta
        
        db = next(get_db())
        try:
            processing_count = db.query(Video).filter(
                Video.status == "processing"
            ).count()
            
            old_processing = db.query(Video).filter(
                Video.status == "processing",
                Video.updated_at < datetime.utcnow() - timedelta(minutes=10)
            ).count()
            
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "processing_videos": processing_count,
                "potentially_stuck": old_processing,
                "recovery_system": "active"
            }
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"❌ Erreur health check: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }