"""
Script de monitoring pour détecter et corriger automatiquement les vidéos
avec des statuts incorrects
"""

import sys
import os
from datetime import datetime, timedelta

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import get_db
from models.video import Video
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def monitor_video_statuses():
    """Surveille et corrige automatiquement les statuts de vidéos incorrects"""
    
    db = next(get_db())
    
    # Rechercher les vidéos uploaded avec des descriptions IA
    uploaded_videos = db.query(Video).filter(Video.status == 'uploaded').all()
    
    corrections_needed = []
    processing_needed = []
    
    logger.info(f"🔍 Surveillance de {len(uploaded_videos)} vidéos 'uploaded'")
    
    for video in uploaded_videos:
        has_ai_description = False
        
        # Vérifier la description
        if video.description:
            ai_indicators = [
                "AI Analysis:",
                "Interior video showcasing",
                "Professional hotel content", 
                "A house with",
                "A living guest",
                "A panoramic window",
                "Stone house with", 
                "The building where",
                "Aerial view of",
                "Sunset over pristine"
            ]
            
            has_ai_description = any(indicator in video.description for indicator in ai_indicators)
        
        # Vérifier les métadonnées
        has_processing_metadata = False
        if video.source_data:
            try:
                if isinstance(video.source_data, str):
                    source_data = json.loads(video.source_data)
                else:
                    source_data = video.source_data
                    
                has_processing_metadata = (
                    isinstance(source_data, dict) and 
                    source_data.get("content_description") and
                    source_data.get("processed_at")
                )
            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ Métadonnées JSON corrompues pour {video.title}: {e}")
                # Marquer pour nettoyage des métadonnées
                has_processing_metadata = False
        
        # Déterminer l'action nécessaire
        if has_ai_description or has_processing_metadata:
            corrections_needed.append(video)
        else:
            # Vidéos anciennes sans traitement (> 24h)
            if video.created_at < datetime.utcnow() - timedelta(hours=24):
                processing_needed.append(video)
    
    # Corriger automatiquement les statuts
    corrected_count = 0
    if corrections_needed:
        logger.info(f"🔧 Correction automatique de {len(corrections_needed)} vidéos")
        
        for video in corrections_needed:
            try:
                video.status = 'ready'
                video.updated_at = datetime.utcnow()
                
                # Nettoyer/créer les métadonnées si nécessaire
                if not video.source_data or isinstance(video.source_data, str):
                    try:
                        if video.source_data:
                            json.loads(video.source_data)  # Test if valid
                    except:
                        # Créer des métadonnées de base
                        clean_metadata = {
                            "auto_corrected_at": datetime.utcnow().isoformat(),
                            "correction_reason": "Status auto-correction by monitor",
                            "had_ai_description": True
                        }
                        video.source_data = json.dumps(clean_metadata)
                
                db.commit()
                corrected_count += 1
                logger.info(f"✅ {video.title} → ready")
                
            except Exception as e:
                logger.error(f"❌ Erreur correction {video.title}: {e}")
                db.rollback()
    
    # Rapporter les vidéos nécessitant un retraitement
    if processing_needed:
        logger.info(f"📋 {len(processing_needed)} vidéos anciennes nécessitent un retraitement:")
        for video in processing_needed[:5]:  # Afficher les 5 premières
            age_hours = (datetime.utcnow() - video.created_at).total_seconds() / 3600
            logger.info(f"   - {video.title} (âge: {age_hours:.1f}h)")
    
    # Statistiques finales
    logger.info(f"📊 Résultats de la surveillance:")
    logger.info(f"   ✅ {corrected_count} vidéos corrigées automatiquement")
    logger.info(f"   ⏳ {len(processing_needed)} vidéos anciennes à retraiter")
    logger.info(f"   🔍 Surveillance terminée")
    
    return {
        "corrected": corrected_count,
        "need_processing": len(processing_needed),
        "total_checked": len(uploaded_videos)
    }

def get_health_status():
    """Retourne l'état de santé des vidéos"""
    
    db = next(get_db())
    
    # Compter par statut
    from sqlalchemy import func
    statuses = db.query(Video.status, func.count(Video.id)).group_by(Video.status).all()
    
    status_counts = dict(statuses)
    
    # Calculer des métriques de santé
    total_videos = sum(status_counts.values())
    ready_videos = status_counts.get('ready', 0) + status_counts.get('completed', 0)
    processing_videos = status_counts.get('processing', 0)
    failed_videos = status_counts.get('failed', 0)
    uploaded_videos = status_counts.get('uploaded', 0)
    
    health_score = (ready_videos / total_videos * 100) if total_videos > 0 else 0
    
    return {
        "total_videos": total_videos,
        "ready_videos": ready_videos,
        "processing_videos": processing_videos,
        "failed_videos": failed_videos, 
        "uploaded_videos": uploaded_videos,
        "health_score": round(health_score, 1),
        "status_distribution": status_counts
    }

if __name__ == "__main__":
    logger.info("🩺 Démarrage de la surveillance des statuts vidéo")
    
    try:
        # État de santé avant
        health_before = get_health_status()
        logger.info(f"📊 État initial - Score de santé: {health_before['health_score']}%")
        
        # Surveillance et correction
        results = monitor_video_statuses()
        
        # État de santé après
        health_after = get_health_status()
        logger.info(f"📊 État final - Score de santé: {health_after['health_score']}%")
        
        # Amélioration
        improvement = health_after['health_score'] - health_before['health_score']
        if improvement > 0:
            logger.info(f"📈 Amélioration: +{improvement:.1f}%")
        
    except Exception as e:
        logger.error(f"❌ Erreur de surveillance: {e}")
        sys.exit(1)