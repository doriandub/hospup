#!/usr/bin/env python3
"""
Script de récupération pour les vidéos bloquées en processing
Relance automatiquement le processing des vidéos qui sont restées bloquées
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging

from core.database import get_db
from models.video import Video
from tasks.video_processing_tasks import process_uploaded_video

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def recover_stuck_videos(max_age_minutes: int = 10):
    """
    Récupère les vidéos bloquées en processing depuis plus de max_age_minutes
    
    Args:
        max_age_minutes: Age maximum en minutes avant de considérer une vidéo comme bloquée
    """
    
    logger.info(f"🔍 Recherche des vidéos bloquées depuis plus de {max_age_minutes} minutes...")
    
    # Obtenir une session de base de données
    db = next(get_db())
    
    try:
        # Calculer la date limite
        cutoff_time = datetime.utcnow() - timedelta(minutes=max_age_minutes)
        
        # Trouver les vidéos bloquées en processing
        stuck_videos = db.query(Video).filter(
            Video.status == "processing",
            Video.created_at < cutoff_time
        ).all()
        
        if not stuck_videos:
            logger.info("✅ Aucune vidéo bloquée trouvée")
            return
        
        logger.info(f"🚨 {len(stuck_videos)} vidéo(s) bloquée(s) trouvée(s):")
        
        for video in stuck_videos:
            age_minutes = (datetime.utcnow() - video.created_at).total_seconds() / 60
            logger.info(f"   - {video.title} (ID: {video.id}) - Bloquée depuis {age_minutes:.1f} minutes")
        
        # Demander confirmation
        response = input(f"\n❓ Voulez-vous relancer le processing pour ces {len(stuck_videos)} vidéo(s) ? (y/N): ")
        
        if response.lower() not in ['y', 'yes', 'oui']:
            logger.info("❌ Opération annulée")
            return
        
        # Relancer le processing pour chaque vidéo bloquée
        success_count = 0
        error_count = 0
        
        for video in stuck_videos:
            try:
                logger.info(f"🔄 Relancement du processing pour {video.title}...")
                
                # Extraire la clé S3 de l'URL vidéo
                video_url = video.video_url
                if video_url.startswith("s3://"):
                    # Format: s3://bucket_name/path/to/file
                    s3_key = "/".join(video_url.split("/")[3:])
                else:
                    # Fallback: essayer de construire la clé S3 à partir du nom de fichier
                    s3_key = f"properties/{video.property_id}/videos/{video.title}"
                
                # Lancer la tâche Celery
                task = process_uploaded_video.delay(str(video.id), s3_key)
                
                # Mettre à jour le task ID
                video.generation_job_id = task.id
                db.commit()
                
                logger.info(f"✅ Tâche relancée: {task.id}")
                success_count += 1
                
            except Exception as e:
                logger.error(f"❌ Erreur pour {video.title}: {e}")
                error_count += 1
        
        logger.info(f"\n📊 Résumé:")
        logger.info(f"   ✅ {success_count} tâche(s) relancée(s)")
        logger.info(f"   ❌ {error_count} erreur(s)")
        
        if success_count > 0:
            logger.info(f"\n💡 Surveillez les logs Celery pour suivre le progress:")
            logger.info(f"   tail -f logs/celery.log")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération: {e}")
    
    finally:
        db.close()

def show_processing_status():
    """
    Affiche le statut actuel du processing vidéo
    """
    logger.info("📊 Statut actuel du processing vidéo:")
    
    db = next(get_db())
    
    try:
        # Compter par statut
        from sqlalchemy import func
        status_counts = db.query(
            Video.status, 
            func.count(Video.id)
        ).group_by(Video.status).all()
        
        total_videos = sum(count for _, count in status_counts)
        
        logger.info(f"   📺 Total des vidéos: {total_videos}")
        for status, count in status_counts:
            logger.info(f"   🏷️  {status}: {count}")
        
        # Détails des vidéos en processing
        processing_videos = db.query(Video).filter(Video.status == "processing").all()
        
        if processing_videos:
            logger.info(f"\n🔄 Vidéos actuellement en processing:")
            for video in processing_videos:
                age_minutes = (datetime.utcnow() - video.created_at).total_seconds() / 60
                logger.info(f"   - {video.title} (depuis {age_minutes:.1f}min)")
        
    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
    
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Récupération des vidéos bloquées en processing")
    parser.add_argument("--status", action="store_true", help="Afficher seulement le statut")
    parser.add_argument("--max-age", type=int, default=10, help="Age maximum en minutes (défaut: 10)")
    parser.add_argument("--force", action="store_true", help="Forcer sans demander confirmation")
    
    args = parser.parse_args()
    
    if args.status:
        show_processing_status()
    else:
        if args.force:
            # Mode forcé pour automation
            logger.info("🤖 Mode forcé activé")
            # TODO: implémenter le mode forcé
        
        recover_stuck_videos(args.max_age)