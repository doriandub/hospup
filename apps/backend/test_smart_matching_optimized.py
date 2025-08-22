#!/usr/bin/env python3
"""
Test avec l'algorithme optimisé de matching intelligent
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.smart_video_matching_service import smart_matching_service

class MockVideo:
    """Mock vidéo pour le test"""
    def __init__(self, id, description):
        self.id = id
        self.description = description

def test_optimized_matching():
    """Test l'algorithme optimisé directement"""
    
    print("🚀 Test de l'algorithme de matching optimisé")
    print("=" * 70)
    
    # Vidéos utilisateur avec descriptions réalistes 
    user_videos = [
        MockVideo("video_pool", "Beautiful swimming pool with crystal clear turquoise water and guests relaxing by the poolside"),
        MockVideo("video_hottub", "Luxury wooden hot tub on outdoor deck with wine glasses and romantic atmosphere"),  
        MockVideo("video_bathroom", "Modern bathroom with rainfall shower head and natural lighting from window"),
        MockVideo("video_breakfast", "Hotel breakfast buffet with fresh croissants, fruits and coffee service on wooden table"),
        MockVideo("video_bedroom", "Elegant bedroom suite with comfortable large bed and cozy intimate atmosphere")
    ]
    
    # Template clips (vraies descriptions de la DB)
    template_clips = [
        {"order": 1, "duration": 1.5, "description": "A hand playfully splashes the turquoise water of a freeform pool, set within a picturesque Italian villa landscape"},
        {"order": 2, "duration": 1.5, "description": "A wooden hot tub, partially covered, sits on a deck beside a tranquil pond, surrounded by greenery, with two glasses of rosé"},
        {"order": 3, "duration": 1.5, "description": "Water cascades from a large, round shower head in a luxurious bathroom, the view through an open window"},
        {"order": 4, "duration": 1.5, "description": "A breakfast spread, complete with croissants, fruit, and coffee, is laid out on a wooden table under a covered patio"},
        {"order": 5, "duration": 1.5, "description": "A serene bedroom, featuring a large bed with rose-colored ottomans, a wicker chair, and green curtains"}
    ]
    
    print("📋 Vidéos disponibles:")
    for video in user_videos:
        print(f"  • {video.id}: {video.description}")
    
    print(f"\n📝 Template clips ({len(template_clips)} clips):")
    for i, clip in enumerate(template_clips, 1):
        print(f"  {i}. {clip['description'][:60]}...")
    
    # Calcule la matrice de similarité
    similarity_matrix = smart_matching_service._calculate_similarity_matrix(user_videos, template_clips)
    
    print(f"\n🔍 Matrice de similarité ({len(user_videos)}x{len(template_clips)}):")
    print("     ", end="")
    for i in range(len(template_clips)):
        print(f"Clip{i+1:2d} ", end="")
    print()
    
    for i, video in enumerate(user_videos):
        print(f"{video.id:12s} ", end="")
        for j in range(len(template_clips)):
            score = similarity_matrix[i][j]
            print(f"{score:6.3f} ", end="")
        print()
    
    # Test l'assignation optimisée
    optimized_assignments = smart_matching_service._optimize_assignments(
        similarity_matrix, user_videos, template_clips
    )
    
    print(f"\n🎯 Assignation optimisée ({len(optimized_assignments)} assignations):")
    print("-" * 70)
    
    total_score = 0
    for assignment in optimized_assignments:
        slot_id = assignment['slotId']
        video_id = assignment['videoId'] 
        confidence = assignment['confidence']
        clip_desc = assignment['clip_description'][:50] + "..."
        video_desc = assignment['video_description'][:50] + "..."
        
        quality = "🟢 Excellent" if confidence >= 0.7 else "🟡 Bon" if confidence >= 0.4 else "🔴 Faible"
        
        print(f"{slot_id}: {video_id} (Score: {confidence:.3f}) {quality}")
        print(f"    Clip:  {clip_desc}")
        print(f"    Vidéo: {video_desc}")
        print()
        
        total_score += confidence
    
    avg_score = total_score / len(optimized_assignments) if optimized_assignments else 0
    
    print("📊 Statistiques de l'assignation:")
    print(f"  Score total: {total_score:.3f}")
    print(f"  Score moyen: {avg_score:.3f}")
    print(f"  Nombre d'assignations: {len(optimized_assignments)}")
    
    # Vérifie que les meilleurs matches sont bien utilisés
    print("\n🏆 Vérification de l'optimisation:")
    print("-" * 40)
    
    # Trouve les 3 meilleurs scores de la matrice
    all_scores = []
    for i in range(len(user_videos)):
        for j in range(len(template_clips)):
            all_scores.append((similarity_matrix[i][j], i, j))
    
    all_scores.sort(reverse=True)
    best_scores = all_scores[:5]
    
    print("🔝 Top 5 des meilleurs matches possibles:")
    for score, video_idx, clip_idx in best_scores:
        video_id = user_videos[video_idx].id
        clip_num = clip_idx + 1
        print(f"  {score:.3f}: {video_id} → Clip {clip_num}")
    
    # Vérifie combien de ces top scores sont utilisés
    used_matches = []
    for assignment in optimized_assignments:
        video_id = assignment['videoId']
        slot_num = int(assignment['slotId'].split('_')[1])
        confidence = assignment['confidence']
        used_matches.append((confidence, video_id, slot_num + 1))
    
    print("\n✅ Matches utilisés dans l'assignation:")
    for score, video_id, clip_num in sorted(used_matches, reverse=True):
        print(f"  {score:.3f}: {video_id} → Clip {clip_num}")
    
    # Calcule l'efficacité
    best_possible_total = sum([score for score, _, _ in best_scores[:len(template_clips)]])
    efficiency = (total_score / best_possible_total * 100) if best_possible_total > 0 else 0
    
    print(f"\n🎯 Efficacité de l'algorithme: {efficiency:.1f}%")
    print(f"   (Score obtenu: {total_score:.3f} / Score optimal théorique: {best_possible_total:.3f})")

if __name__ == "__main__":
    test_optimized_matching()