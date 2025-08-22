#!/usr/bin/env python3
"""
Test simple du système AI de matching viral
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.ai_matching_service import ai_matching_service
from models.viral_video_template import ViralVideoTemplate
from core.database import SessionLocal

def test_viral_matching():
    """Test direct du système AI sans authentification"""
    print("🧪 Test direct du système AI de matching viral")
    
    # Connexion à la base
    db = SessionLocal()
    
    try:
        # 1. Récupérer les templates
        templates = db.query(ViralVideoTemplate).all()
        print(f"✅ {len(templates)} templates trouvés dans la base")
        
        if not templates:
            print("❌ Aucun template viral trouvé")
            return False
        
        # Affichage des templates disponibles
        print("\n📋 Templates disponibles:")
        for i, template in enumerate(templates[:5], 1):  # Limité à 5 pour lisibilité
            print(f"  {i}. {template.hotel_name} ({template.country}) - {template.views or 0} vues")
            
        # 2. Tests de matching
        test_queries = [
            "petit dejeuner francais croissant cuisine",
            "breakfast french cuisine",  
            "Italian villa tuscany",
            "romantic dinner sunset"
        ]
        
        print(f"\n🔍 Test du matching AI avec {len(test_queries)} requêtes:")
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n--- Test {i}: '{query}' ---")
            
            # Utiliser le service AI
            matches = ai_matching_service.find_best_matches(
                user_description=query,
                property_description="Hôtel de charme français",  # Description générique
                templates=templates,
                top_k=3
            )
            
            if matches:
                print(f"✅ {len(matches)} matches trouvés:")
                for j, match in enumerate(matches, 1):
                    template = match['template']
                    score = match['similarity_score']
                    reasoning = match.get('ai_reasoning', 'N/A')
                    
                    print(f"  #{j}: {template.hotel_name} ({template.country})")
                    print(f"      Score: {score:.3f}")
                    print(f"      Vues: {template.views or 0:,}")
                    print(f"      Raison: {reasoning[:60]}...")
            else:
                print("❌ Aucun match trouvé")
        
        print(f"\n🎉 Test terminé avec succès!")
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False
        
    finally:
        db.close()

def test_script_parsing():
    """Test le parsing des scripts JSON"""
    print("\n🧪 Test du parsing des scripts")
    
    db = SessionLocal()
    try:
        templates_with_scripts = db.query(ViralVideoTemplate).filter(
            ViralVideoTemplate.script.isnot(None)
        ).limit(3).all()
        
        print(f"✅ {len(templates_with_scripts)} templates avec scripts trouvés")
        
        for template in templates_with_scripts:
            print(f"\n📄 Script de {template.hotel_name}:")
            content = ai_matching_service.extract_script_content(template.script or '')
            if content:
                preview = content[:150] + "..." if len(content) > 150 else content
                print(f"  Contenu extrait: {preview}")
            else:
                print("  ❌ Échec extraction du contenu")
                
    except Exception as e:
        print(f"❌ Erreur parsing: {e}")
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Test simple du système viral matching")
    
    # Test du matching
    success = test_viral_matching()
    
    # Test du parsing des scripts
    test_script_parsing()
    
    if success:
        print("\n✅ SYSTÈME FONCTIONNEL ! Le matching AI fonctionne correctement.")
        print("💡 Le problème vient probablement de l'authentification frontend/backend")
    else:
        print("\n❌ Problème avec le système AI de base")