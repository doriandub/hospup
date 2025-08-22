"""
Script de test complet pour la génération vidéo v3
Teste le système end-to-end avec des vraies données
"""

import json
import uuid
from datetime import datetime
from tasks.video_generation_v3 import generate_video_from_timeline_v3
from core.database import get_db
from models.video import Video

def test_video_generation():
    """Test complet de génération vidéo avec données réelles"""
    
    # Données réelles de l'Hotel du Roc
    property_id = "ddcf34eb-4612-4fb8-91fa-cfb30aac606d"
    user_id = "f2fc6097-c5bb-4d27-8f14-9c2b8db763e1" 
    template_id = "e50460ce-67fa-442b-bfe6-9c13b1fa87c5"
    
    # Vidéos de la content library (5 premières vidéos uploadées)
    content_library_videos = [
        "409eb209-97e4-4d2e-8502-d18debd973b8",  # IMG_0604 2.MOV
        "d69732d5-891c-4027-9182-03799d8d942a",  # IMG_0651.mov  
        "f88fbfdd-b63a-4bc1-bf65-d2c622fb8e1a",  # IMG_0574.MOV
        "66680fc1-5050-45ef-afed-4915c1cbd0bd",  # IMG_0494.MOV
        "f858b196-1c78-4fa5-8110-d74634bb8361"   # IMG_0590.MOV
    ]
    
    # Créer un nouveau video ID pour le test
    test_video_id = str(uuid.uuid4())
    
    # Créer l'enregistrement vidéo dans la DB
    db = next(get_db())
    try:
        test_video = Video(
            id=test_video_id,
            title="Test Video Generation v3",
            description="Test automatique du système de génération",
            video_url="",  # Temporary empty string, will be updated by generation
            status="processing",
            language="fr",
            source_type="test_generation",
            user_id=user_id,
            property_id=property_id,
            viral_video_id=template_id,
            created_at=datetime.now()
        )
        
        db.add(test_video)
        db.commit()
        
        print(f"✅ Vidéo de test créée: {test_video_id}")
        
        # Données de timeline comme le composer les envoie
        timeline_data = {
            "slot_assignments": [
                {"slotId": "slot_0", "videoId": content_library_videos[0], "confidence": 1},
                {"slotId": "slot_1", "videoId": content_library_videos[1], "confidence": 1}, 
                {"slotId": "slot_2", "videoId": content_library_videos[2], "confidence": 1},
                {"slotId": "slot_3", "videoId": content_library_videos[3], "confidence": 1},
                {"slotId": "slot_4", "videoId": content_library_videos[4], "confidence": 1}
            ],
            "text_overlays": [],
            "total_duration": 30,
            "style_settings": {
                "font": "Helvetica",
                "color": "#FFFFFF", 
                "size": "medium",
                "shadow": True,
                "outline": True,
                "background": False
            }
        }
        
        print(f"📋 Timeline data préparée:")
        print(f"   - 5 slots assignés")
        print(f"   - Vidéos: {[v[:8] + '...' for v in content_library_videos]}")
        print(f"   - Template: {template_id}")
        
        # Lancer la génération vidéo via Celery
        print(f"🚀 Lancement de la génération vidéo via Celery...")
        
        task = generate_video_from_timeline_v3.delay(
            video_id=test_video_id,
            property_id=property_id,
            user_id=user_id,
            timeline_data=timeline_data,
            template_id=template_id,
            language="fr"
        )
        
        print(f"⏳ Task ID: {task.id}")
        print(f"🔄 Attente de la completion...")
        
        # Attendre que la tâche se termine (timeout après 5 minutes)
        result = task.get(timeout=300)
        
        print(f"🎉 SUCCÈS ! Génération terminée:")
        print(f"   - Video ID: {result.get('video_id', 'N/A')}")
        print(f"   - Durée: {result.get('duration', 'N/A')}s")
        print(f"   - Segments: {result.get('segments_processed', 'N/A')}")
        print(f"   - Status: {result.get('status', 'N/A')}")
        print(f"")
        print(f"🔗 LIEN VIDEO AWS:")
        print(f"   {result.get('video_url', 'N/A')}")
        print(f"")
        print(f"🖼️ THUMBNAIL:")
        print(f"   {result.get('thumbnail_url', 'N/A')}")
        print(f"")
        print(f"📊 RÉSULTAT COMPLET:")
        print(f"   {result}")
        
        return result
        
    except Exception as e:
        print(f"❌ ERREUR lors de la génération: {e}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🎬 Test de génération vidéo v3")
    print("=" * 50)
    result = test_video_generation()
    
    if result:
        print("=" * 50)
        print("✅ TEST RÉUSSI ! La vidéo a été générée avec succès.")
        print("Vous pouvez maintenant tester le lien AWS ci-dessus.")
    else:
        print("=" * 50)
        print("❌ TEST ÉCHOUÉ ! Vérifiez les logs d'erreur ci-dessus.")