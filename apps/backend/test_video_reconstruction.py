#!/usr/bin/env python3
"""
Test de la reconstruction vidéo pour le Sémaphore de Lervilly
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.video_reconstruction_service import video_reconstruction_service
from models.viral_video_template import ViralVideoTemplate
from core.database import SessionLocal

def test_video_reconstruction():
    """Test la reconstruction vidéo complète"""
    print("🎬 Test de Reconstruction Vidéo - Sémaphore de Lervilly")
    
    # IDs obtenus de la base
    template_id = "8b76a94b-08e7-434e-bce6-9d70a307e888"  # Template Sémaphore
    property_id = "EF7C70A2-5A28-4654-9881-99A8BD0BE622"  # Propriété avec vidéos uploadées
    
    db = SessionLocal()
    
    try:
        # Récupérer le template
        template = db.query(ViralVideoTemplate).filter(
            ViralVideoTemplate.id == template_id
        ).first()
        
        if not template:
            print(f"❌ Template {template_id} non trouvé")
            return
            
        print(f"✅ Template trouvé: {template.title}")
        print(f"🏨 Hôtel: {template.hotel_name}")
        
        # Créer le plan de reconstruction
        print(f"\n🔍 Analyse du script et matching avec les vidéos uploadées...")
        
        reconstruction_plan = video_reconstruction_service.create_reconstruction_timeline(
            template=template,
            property_id=property_id,
            db=db
        )
        
        if "error" in reconstruction_plan:
            print(f"❌ Erreur: {reconstruction_plan['error']}")
            return
        
        # Afficher les statistiques
        stats = reconstruction_plan['statistics']
        print(f"\n📊 STATISTIQUES DE RECONSTRUCTION:")
        print(f"   • Total clips requis: {stats['total_clips']}")
        print(f"   • Clips matchés: {stats['matched_clips']}")
        print(f"   • Clips manquants: {stats['missing_clips']}")
        print(f"   • Pourcentage de match: {stats['match_percentage']:.1f}%")
        print(f"   • Peut créer vidéo: {'✅ OUI' if stats['can_create_video'] else '❌ NON'}")
        print(f"   • Vidéos disponibles: {stats['available_videos_count']}")
        
        # Afficher la timeline
        print(f"\n🎞️ TIMELINE DE RECONSTRUCTION:")
        for i, item in enumerate(reconstruction_plan['timeline'], 1):
            print(f"\nClip #{i} ({item['start_time']:.1f}s - {item['end_time']:.1f}s):")
            print(f"   📝 Description: {item['clip_description'][:80]}...")
            
            if item['matched_video']:
                video = item['matched_video']
                print(f"   ✅ Vidéo matchée: {video['title']}")
                print(f"   🎯 Confiance: {item['confidence_score']:.2f}")
                print(f"   💡 Instructions: {item['instructions']}")
            else:
                print(f"   ❌ Aucune vidéo correspondante")
        
        # Textes overlay
        if reconstruction_plan.get('overlay_texts'):
            print(f"\n📝 TEXTES OVERLAY:")
            for text in reconstruction_plan['overlay_texts']:
                print(f"   • {text['start_time']}s: \"{text['content']}\"")
        
        # Conseils d'édition
        if reconstruction_plan.get('editing_tips'):
            print(f"\n💡 CONSEILS D'ÉDITION:")
            for tip in reconstruction_plan['editing_tips']:
                print(f"   • {tip}")
        
        # Scènes manquantes
        if reconstruction_plan.get('missing_scenes'):
            print(f"\n🎬 SCÈNES À FILMER:")
            for scene in reconstruction_plan['missing_scenes']:
                print(f"   • {scene}")
        
        print(f"\n🎉 Test de reconstruction terminé avec succès!")
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_video_reconstruction()