#!/usr/bin/env python3
"""
Test réaliste du matching intelligent avec des descriptions similaires
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.smart_video_matching_service import smart_matching_service

def test_realistic_matching():
    """Test avec des descriptions réalistes qui matchent bien"""
    
    print("🎯 Test de matching réaliste avec des descriptions similaires")
    print("=" * 70)
    
    # Simule des descriptions de vidéos réalistes 
    user_videos_mock = [
        {"id": "video_1", "description": "Beautiful swimming pool with crystal clear water and guests relaxing"},
        {"id": "video_2", "description": "Luxury wooden hot tub on outdoor deck with wine glasses"},  
        {"id": "video_3", "description": "Modern bathroom with rainfall shower and natural lighting"},
        {"id": "video_4", "description": "Hotel breakfast buffet with fresh croissants, fruits and coffee service"},
        {"id": "video_5", "description": "Elegant bedroom suite with comfortable bed and cozy atmosphere"}
    ]
    
    # Descriptions des clips de la template (tirées de la vraie DB)
    template_clips_mock = [
        {"order": 1, "description": "A hand playfully splashes the turquoise water of a freeform pool, set within a picturesque Italian villa landscape"},
        {"order": 2, "description": "A wooden hot tub, partially covered, sits on a deck beside a tranquil pond, surrounded by greenery, with two glasses of rosé"},
        {"order": 3, "description": "Water cascades from a large, round shower head in a luxurious bathroom, the view through an open window"},
        {"order": 4, "description": "A breakfast spread, complete with croissants, fruit, and coffee, is laid out on a wooden table under a covered patio"},
        {"order": 5, "description": "A serene bedroom, featuring a large bed with rose-colored ottomans, a wicker chair, and green curtains"}
    ]
    
    print("📋 Descriptions des vidéos utilisateur:")
    for i, video in enumerate(user_videos_mock, 1):
        print(f"  {i}. {video['description']}")
    
    print("\n📝 Descriptions des clips template:")
    for i, clip in enumerate(template_clips_mock, 1):
        print(f"  {i}. {clip['description'][:60]}...")
    
    print("\n🔍 Calcul de la matrice de similarité:")
    print("-" * 50)
    
    # Calcule et affiche la matrice de similarité
    matrix = []
    for i, video in enumerate(user_videos_mock):
        row = []
        print(f"\nVidéo {i+1}: {video['description'][:40]}...")
        for j, clip in enumerate(template_clips_mock):
            similarity = smart_matching_service.calculate_text_similarity(
                video['description'], 
                clip['description']
            )
            row.append(similarity)
            print(f"  → Clip {j+1}: {similarity:.3f}")
        matrix.append(row)
    
    # Trouve la meilleure assignation
    print("\n🎯 Optimisation de l'assignation:")
    print("-" * 50)
    
    best_assignments = []
    used_videos = set()
    
    for i, clip in enumerate(template_clips_mock):
        best_video_idx = None
        best_score = 0.0
        
        for j, video in enumerate(user_videos_mock):
            if j in used_videos:
                continue
            score = matrix[j][i]
            if score > best_score:
                best_score = score
                best_video_idx = j
        
        if best_video_idx is not None:
            best_assignments.append({
                "clip_order": i + 1,
                "video_id": user_videos_mock[best_video_idx]['id'],
                "video_description": user_videos_mock[best_video_idx]['description'][:50] + "...",
                "clip_description": clip['description'][:50] + "...",
                "confidence": best_score
            })
            used_videos.add(best_video_idx)
            
            quality = "🟢 Excellent" if best_score >= 0.7 else "🟡 Bon" if best_score >= 0.4 else "🔴 Faible"
            print(f"Clip {i+1} → Vidéo {best_video_idx+1} (Score: {best_score:.3f}) {quality}")
    
    print("\n📊 Résumé de l'assignation optimisée:")
    print("-" * 50)
    
    scores = [assignment['confidence'] for assignment in best_assignments]
    avg_score = sum(scores) / len(scores) if scores else 0
    
    print(f"Score moyen: {avg_score:.3f}")
    print(f"Score minimum: {min(scores):.3f}")
    print(f"Score maximum: {max(scores):.3f}")
    
    high_quality = len([s for s in scores if s >= 0.7])
    medium_quality = len([s for s in scores if 0.4 <= s < 0.7])
    low_quality = len([s for s in scores if s < 0.4])
    
    print(f"Matches haute qualité (≥0.7): {high_quality}")
    print(f"Matches qualité moyenne (0.4-0.7): {medium_quality}")
    print(f"Matches faible qualité (<0.4): {low_quality}")
    
    print("\n🎬 Assignations finales détaillées:")
    print("-" * 50)
    
    for assignment in best_assignments:
        print(f"Clip {assignment['clip_order']}:")
        print(f"  Vidéo: {assignment['video_id']}")
        print(f"  Confidence: {assignment['confidence']:.3f}")
        print(f"  Vidéo: {assignment['video_description']}")
        print(f"  Clip: {assignment['clip_description']}")
        print()

if __name__ == "__main__":
    test_realistic_matching()