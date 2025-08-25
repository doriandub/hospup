"""
Script pour nettoyer et corriger les vidéos en statut 'uploaded'
- Met à jour les vidéos qui ont déjà une description IA vers 'ready'
- Relance le traitement pour celles qui en ont besoin
"""

import sys
import os

# Ajouter le répertoire parent au path pour importer les modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import get_db
from models.video import Video
from tasks.video_processing_tasks import process_uploaded_video
from sqlalchemy import text
import json
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_uploaded_videos():
    """Analyse les vidéos en statut uploaded"""
    
    db = next(get_db())
    
    uploaded_videos = db.query(Video).filter(Video.status == 'uploaded').all()
    
    print(f"\n📊 Analyse de {len(uploaded_videos)} vidéos 'uploaded':")
    
    # Catégoriser les vidéos
    ready_to_fix = []  # Ont une description IA → à passer en ready
    need_processing = []  # Pas de description IA → à retraiter
    
    for video in uploaded_videos:
        has_ai_description = False
        
        # Vérifier s'il y a une description IA
        if video.description:
            # Chercher des indicateurs de description IA
            ai_indicators = [
                "AI Analysis:",
                "Interior video showcasing",
                "Professional hotel content",
                "A house with",
                "A living guest",
                "A panoramic window",
                "Stone house with",
                "The building where",
                "Aerial view of"
            ]
            
            has_ai_description = any(indicator in video.description for indicator in ai_indicators)
        
        # Vérifier les métadonnées de traitement
        has_processing_metadata = False
        if video.source_data:
            try:
                source_data = json.loads(video.source_data) if isinstance(video.source_data, str) else video.source_data
                has_processing_metadata = (
                    isinstance(source_data, dict) and 
                    source_data.get("content_description") and
                    source_data.get("processed_at")
                )
            except:
                pass
        
        if has_ai_description or has_processing_metadata:
            ready_to_fix.append(video)
        else:
            need_processing.append(video)
    
    print(f"✅ À passer en 'ready': {len(ready_to_fix)} vidéos")
    print(f"🔄 À retraiter: {len(need_processing)} vidéos")
    
    return ready_to_fix, need_processing

def fix_ready_videos(videos):
    """Met à jour les vidéos qui sont prêtes vers le statut 'ready'"""
    
    db = next(get_db())
    
    print(f"\n🔧 Correction de {len(videos)} vidéos vers 'ready'...")
    
    updated_count = 0
    
    for video in videos:
        try:
            # Mettre à jour le statut
            video.status = 'ready'
            video.updated_at = datetime.utcnow()
            
            # S'assurer que les métadonnées indiquent un traitement réussi
            if video.source_data:
                try:
                    source_data = json.loads(video.source_data) if isinstance(video.source_data, str) else video.source_data
                    if isinstance(source_data, dict):
                        source_data["status_corrected_at"] = datetime.utcnow().isoformat()
                        source_data["correction_reason"] = "Had AI description but wrong status"
                        video.source_data = json.dumps(source_data)
                except:
                    pass
            
            db.commit()
            updated_count += 1
            
            logger.info(f"✅ {video.title} → ready")
            
        except Exception as e:
            logger.error(f"❌ Erreur pour {video.title}: {e}")
            db.rollback()
    
    print(f"✅ {updated_count} vidéos mises à jour vers 'ready'")
    
    return updated_count

def reprocess_videos(videos, limit=None):
    """Relance le traitement pour les vidéos qui en ont besoin"""
    
    db = next(get_db())
    
    videos_to_process = videos[:limit] if limit else videos
    
    print(f"\n🔄 Retraitement de {len(videos_to_process)} vidéos...")
    
    processed_count = 0
    
    for video in videos_to_process:
        try:
            # Extraire la clé S3 de l'URL
            if video.video_url and 's3://' in video.video_url:
                s3_key = video.video_url.split('s3://')[1].split('/', 1)[1]
                
                # Mettre le statut à processing
                video.status = 'processing'
                video.updated_at = datetime.utcnow()
                db.commit()
                
                # Lancer la tâche Celery
                task = process_uploaded_video.delay(str(video.id), s3_key)
                
                # Sauvegarder l'ID de la tâche
                video.generation_job_id = task.id
                db.commit()
                
                processed_count += 1
                
                logger.info(f"🔄 {video.title} → processing (tâche: {task.id})")
                
            else:
                logger.warning(f"⚠️ URL S3 invalide pour {video.title}: {video.video_url}")
                
        except Exception as e:
            logger.error(f"❌ Erreur pour {video.title}: {e}")
            db.rollback()
    
    print(f"🔄 {processed_count} vidéos relancées en traitement")
    
    return processed_count

def main():
    """Fonction principale"""
    
    print("🧹 Script de nettoyage des vidéos 'uploaded'")
    print("=" * 50)
    
    # Analyser les vidéos
    ready_to_fix, need_processing = analyze_uploaded_videos()
    
    # Demander confirmation
    print("\n❓ Que voulez-vous faire ?")
    print("1. Corriger les vidéos prêtes (uploaded → ready)")
    print("2. Retraiter les vidéos sans IA (quelques-unes pour test)")
    print("3. Retraiter toutes les vidéos sans IA")
    print("4. Faire tout automatiquement")
    print("0. Annuler")
    
    try:
        choice = input("\nVotre choix (0-4): ").strip()
        
        if choice == '0':
            print("❌ Annulé")
            return
        
        elif choice == '1':
            if ready_to_fix:
                fix_ready_videos(ready_to_fix)
            else:
                print("ℹ️ Aucune vidéo à corriger")
        
        elif choice == '2':
            if need_processing:
                reprocess_videos(need_processing, limit=5)
            else:
                print("ℹ️ Aucune vidéo à retraiter")
        
        elif choice == '3':
            if need_processing:
                confirm = input(f"⚠️ Confirmer le retraitement de {len(need_processing)} vidéos ? (y/N): ")
                if confirm.lower() == 'y':
                    reprocess_videos(need_processing)
                else:
                    print("❌ Annulé")
            else:
                print("ℹ️ Aucune vidéo à retraiter")
        
        elif choice == '4':
            print("🚀 Traitement automatique...")
            
            # Corriger les vidéos prêtes
            if ready_to_fix:
                fix_ready_videos(ready_to_fix)
            
            # Retraiter quelques vidéos pour test
            if need_processing:
                print(f"\n🔄 Test de retraitement sur 5 vidéos...")
                reprocess_videos(need_processing, limit=5)
        
        else:
            print("❌ Choix invalide")
            
        print("\n✅ Script terminé")
        
    except KeyboardInterrupt:
        print("\n❌ Interrompu par l'utilisateur")
    except Exception as e:
        print(f"\n❌ Erreur: {e}")

if __name__ == "__main__":
    main()