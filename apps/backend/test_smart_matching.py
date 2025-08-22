#!/usr/bin/env python3
"""
Test script pour le matching intelligent entre vidéos et templates
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.smart_video_matching_service import smart_matching_service

def test_text_similarity():
    """Test la fonction de similarité textuelle"""
    
    print("🧪 Test de similarité textuelle...")
    print("=" * 50)
    
    # Tests de base
    test_cases = [
        # (text1, text2, expected_similarity_range)
        ("A beautiful swimming pool with turquoise water", 
         "A hand playfully splashes the turquoise water of a freeform pool", 
         (0.4, 0.8)),
        
        ("Luxury bedroom with comfortable bed", 
         "A serene bedroom, featuring a large bed with rose-colored ottomans", 
         (0.3, 0.7)),
        
        ("Hotel breakfast with croissants and coffee", 
         "A breakfast spread, complete with croissants, fruit, and coffee", 
         (0.5, 0.9)),
        
        ("Modern bathroom with shower", 
         "Water cascades from a large, round shower head in a luxurious bathroom", 
         (0.3, 0.7)),
        
        ("Outdoor dining area", 
         "A serene bedroom, featuring a large bed", 
         (0.0, 0.3))  # Pas de similarité
    ]
    
    for i, (text1, text2, expected_range) in enumerate(test_cases, 1):
        similarity = smart_matching_service.calculate_text_similarity(text1, text2)
        min_expected, max_expected = expected_range
        
        status = "✅" if min_expected <= similarity <= max_expected else "❌"
        
        print(f"Test {i}: {status}")
        print(f"  Text 1: {text1}")
        print(f"  Text 2: {text2}")
        print(f"  Similarité: {similarity:.3f} (attendu: {min_expected}-{max_expected})")
        print()

def test_real_matching():
    """Test le matching avec de vraies données de la DB"""
    
    print("🎯 Test de matching réel avec la base de données...")
    print("=" * 50)
    
    # Utilise les IDs réels de la DB
    property_id = "ddcf34eb-4612-4fb8-91fa-cfb30aac606d"  # Hotel du Roc
    template_id = "e50460ce-67fa-442b-bfe6-9c13b1fa87c5"  # Template avec 5 clips
    
    try:
        result = smart_matching_service.find_best_matches(
            property_id=property_id,
            template_id=template_id
        )
        
        slot_assignments = result.get("slot_assignments", [])
        matching_scores = result.get("matching_scores", {})
        
        print(f"🏨 Propriété: {property_id}")
        print(f"📝 Template: {template_id}")
        print(f"📊 Nombre d'assignations: {len(slot_assignments)}")
        print(f"📈 Score moyen: {matching_scores.get('average_score', 0):.3f}")
        print(f"📉 Score min: {matching_scores.get('min_score', 0):.3f}")
        print(f"📈 Score max: {matching_scores.get('max_score', 0):.3f}")
        print()
        
        print("🔍 Détails des assignations:")
        print("-" * 30)
        
        for i, assignment in enumerate(slot_assignments[:5], 1):  # Limite à 5 pour lisibilité
            print(f"Slot {i}:")
            print(f"  VideoID: {assignment.get('videoId', 'N/A')}")
            print(f"  Confidence: {assignment.get('confidence', 0):.3f}")
            print(f"  Clip description: {assignment.get('clip_description', 'N/A')[:80]}...")
            print(f"  Video description: {assignment.get('video_description', 'N/A')[:80]}...")
            print()
        
        # Analyse de la qualité
        print("📋 Analyse de qualité:")
        print(f"  Matches haute qualité (>0.7): {matching_scores.get('high_quality_matches', 0)}")
        print(f"  Matches qualité moyenne (0.4-0.7): {matching_scores.get('medium_quality_matches', 0)}")
        print(f"  Matches faible qualité (<0.4): {matching_scores.get('low_quality_matches', 0)}")
        
        if matching_scores.get('fallback_mode'):
            print("⚠️  Mode fallback utilisé")
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Exécute tous les tests"""
    print("🚀 Test du système de matching intelligent")
    print("=" * 70)
    print()
    
    # Test 1: Similarité textuelle
    test_text_similarity()
    
    print()
    print("=" * 70)
    print()
    
    # Test 2: Matching réel
    test_real_matching()
    
    print()
    print("✅ Tests terminés!")
    print()
    print("💡 Le système de matching intelligent:")
    print("   • Compare les descriptions des vidéos avec le script de la template")
    print("   • Utilise une similarité sémantique avancée") 
    print("   • Optimise l'assignation pour maximiser la pertinence")
    print("   • Fournit un score de confiance pour chaque match")

if __name__ == "__main__":
    main()