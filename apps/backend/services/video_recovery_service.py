"""
Service de récupération automatique des vidéos bloquées en processing
Surveille en continu et relance automatiquement les tâches bloquées
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from core.database import get_db
from models.video import Video
from tasks.video_processing_tasks import process_uploaded_video
from tasks.video_generation_v3 import generate_video_from_timeline_v3

logger = logging.getLogger(__name__)

class VideoRecoveryService:
    """Service de récupération automatique des vidéos bloquées"""
    
    def __init__(self, check_interval_seconds: int = 60, max_processing_minutes: int = 5):
        """
        Args:
            check_interval_seconds: Intervalle entre les vérifications (défaut: 60s)
            max_processing_minutes: Durée max avant de considérer une vidéo bloquée (défaut: 5min)
        """
        self.check_interval = check_interval_seconds
        self.max_processing_time = timedelta(minutes=max_processing_minutes)
        self.is_running = False
        self.recovery_stats = {
            "total_recoveries": 0,
            "last_check": None,
            "videos_recovered": [],
            "active_since": datetime.utcnow()
        }
    
    async def start_monitoring(self):
        """Démarre la surveillance automatique en arrière-plan"""
        self.is_running = True
        self.recovery_stats["active_since"] = datetime.utcnow()
        
        logger.info(f"🔍 Démarrage du monitoring automatique des vidéos (vérification toutes les {self.check_interval}s)")
        
        while self.is_running:
            try:
                await self.check_and_recover_stuck_videos()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"❌ Erreur dans le monitoring automatique: {e}")
                # Continue monitoring même en cas d'erreur
                await asyncio.sleep(self.check_interval)
    
    def stop_monitoring(self):
        """Arrête la surveillance automatique"""
        self.is_running = False
        logger.info("🛑 Arrêt du monitoring automatique des vidéos")
    
    async def check_and_recover_stuck_videos(self) -> Dict[str, Any]:
        """
        Vérifie et récupère automatiquement les vidéos bloquées
        
        Returns:
            Résultats de la vérification
        """
        try:
            self.recovery_stats["last_check"] = datetime.utcnow()
            
            # Obtenir une session DB
            db = next(get_db())
            
            try:
                # Trouver les vidéos bloquées
                cutoff_time = datetime.utcnow() - self.max_processing_time
                
                stuck_videos = db.query(Video).filter(
                    Video.status == "processing",
                    Video.created_at < cutoff_time,
                    # Exclure les anciennes vidéos de test (plus de 24h)
                    Video.created_at > datetime.utcnow() - timedelta(hours=24)
                ).all()
                
                if not stuck_videos:
                    logger.debug("✅ Aucune vidéo bloquée détectée")
                    return {
                        "status": "healthy",
                        "stuck_videos_found": 0,
                        "recoveries_performed": 0
                    }
                
                # Relancer automatiquement les vidéos bloquées
                recovered_count = 0
                recovery_errors = []
                
                logger.warning(f"🚨 {len(stuck_videos)} vidéo(s) bloquée(s) détectée(s), relancement automatique...")
                
                for video in stuck_videos:
                    try:
                        age_minutes = (datetime.utcnow() - video.created_at).total_seconds() / 60
                        logger.info(f"🔄 Récupération automatique: {video.title} (bloquée depuis {age_minutes:.1f}min)")
                        
                        # Déterminer le type de récupération basé sur source_data
                        source_data = getattr(video, 'source_data', None)
                        task = None
                        
                        if source_data and isinstance(source_data, (str, dict)):
                            # Parse source_data si c'est une string JSON
                            if isinstance(source_data, str):
                                import json
                                try:
                                    source_data = json.loads(source_data)
                                except:
                                    source_data = {}
                            
                            # Vidéo générée avec timeline (contient template_id, slot_assignments, text_overlays)
                            if source_data.get('template_id') and source_data.get('slot_assignments'):
                                logger.info(f"🎬 Récupération d'une vidéo générée (timeline v3)")
                                
                                # Reconstituer les paramètres pour generate_video_from_timeline_v3
                                template_id = source_data.get('template_id')
                                property_id = str(video.property_id)
                                user_id = str(video.user_id)
                                timeline_data = {
                                    'slot_assignments': source_data.get('slot_assignments', []),
                                    'text_overlays': source_data.get('text_overlays', [])
                                }
                                
                                task = generate_video_from_timeline_v3.delay(
                                    str(video.id), property_id, user_id, timeline_data, template_id
                                )
                                
                            else:
                                # Vidéo uploadée classique - utiliser l'ancienne méthode
                                logger.info(f"📤 Récupération d'une vidéo uploadée")
                                
                                # Extraire la clé S3
                                video_url = video.video_url
                                if video_url and video_url.startswith("s3://"):
                                    s3_key = "/".join(video_url.split("/")[3:])
                                else:
                                    s3_key = f"properties/{video.property_id}/videos/{video.title}"
                                
                                task = process_uploaded_video.delay(str(video.id), s3_key)
                                
                        else:
                            # Fallback - traiter comme vidéo uploadée
                            logger.info(f"📤 Récupération d'une vidéo (fallback upload)")
                            
                            video_url = video.video_url
                            if video_url and video_url.startswith("s3://"):
                                s3_key = "/".join(video_url.split("/")[3:])
                            else:
                                s3_key = f"properties/{video.property_id}/videos/{video.title}"
                            
                            task = process_uploaded_video.delay(str(video.id), s3_key)
                        
                        if task:
                            # Mettre à jour le task ID
                            video.generation_job_id = task.id
                            db.commit()
                            
                            # Statistiques
                            self.recovery_stats["total_recoveries"] += 1
                            self.recovery_stats["videos_recovered"].append({
                                "video_id": video.id,
                                "title": video.title,
                                "recovered_at": datetime.utcnow().isoformat(),
                                "task_id": task.id,
                                "age_minutes": age_minutes
                            })
                            
                            # Garder seulement les 50 dernières récupérations
                            if len(self.recovery_stats["videos_recovered"]) > 50:
                                self.recovery_stats["videos_recovered"] = self.recovery_stats["videos_recovered"][-50:]
                            
                            recovered_count += 1
                            logger.info(f"✅ Tâche relancée: {task.id}")
                        else:
                            logger.error(f"❌ Impossible de déterminer le type de récupération pour {video.title}")
                        
                    except Exception as e:
                        error_msg = f"Erreur récupération {video.title}: {e}"
                        recovery_errors.append(error_msg)
                        logger.error(f"❌ {error_msg}")
                
                # Log du résultat
                if recovered_count > 0:
                    logger.info(f"🎯 Récupération automatique terminée: {recovered_count}/{len(stuck_videos)} vidéos relancées")
                else:
                    logger.error(f"❌ Aucune vidéo récupérée sur {len(stuck_videos)} bloquées")
                
                return {
                    "status": "recovery_performed" if recovered_count > 0 else "recovery_failed",
                    "stuck_videos_found": len(stuck_videos),
                    "recoveries_performed": recovered_count,
                    "errors": recovery_errors,
                    "recovered_videos": [v["title"] for v in self.recovery_stats["videos_recovered"][-recovered_count:]]
                }
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Erreur critique dans check_and_recover_stuck_videos: {e}")
            return {
                "status": "error",
                "error": str(e),
                "stuck_videos_found": 0,
                "recoveries_performed": 0
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du service de récupération"""
        uptime_seconds = (datetime.utcnow() - self.recovery_stats["active_since"]).total_seconds()
        
        return {
            "is_running": self.is_running,
            "uptime_minutes": round(uptime_seconds / 60, 1),
            "check_interval_seconds": self.check_interval,
            "max_processing_minutes": self.max_processing_time.total_seconds() / 60,
            "total_recoveries": self.recovery_stats["total_recoveries"],
            "last_check": self.recovery_stats["last_check"].isoformat() if self.recovery_stats["last_check"] else None,
            "recent_recoveries": self.recovery_stats["videos_recovered"][-10:],  # 10 dernières
        }

# Instance globale du service
video_recovery_service = VideoRecoveryService(
    check_interval_seconds=30,  # Vérification toutes les 30 secondes
    max_processing_minutes=1.5  # Relancer après 90 secondes de blocage
)