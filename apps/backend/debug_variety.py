#!/usr/bin/env python3
"""
Debug script pour analyser la variété des résultats
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.ai_matching_service import ai_matching_service
from models.viral_video_template import ViralVideoTemplate
from core.database import SessionLocal

def test_result_variety():
    """Test la variété des résultats avec différentes descriptions"""
    print("🧪 Test de la variété des résultats")
    
    db = SessionLocal()
    
    try:
        templates = db.query(ViralVideoTemplate).all()
        print(f"✅ {len(templates)} templates disponibles")
        
        # Affichage de tous les templates pour référence
        print(f"\n📋 TOUS LES TEMPLATES DISPONIBLES:")
        for i, template in enumerate(templates, 1):
            print(f"  {i}. {template.hotel_name} ({template.country}) - {template.views or 0:,} vues")
            print(f"     Titre: {template.title}")
            print(f"     Username: @{template.username}")
        
        # Tests avec descriptions très différentes
        test_cases = [
            ("petit dejeuner francais croissant", "Devrait favoriser Les Oliviers du Taulisson (France)"),
            ("Italian villa tuscany sunset pool", "Devrait favoriser Tenuta di Murlo (Italy)"),
            ("romantic dinner wine", "Devrait être différent"),
            ("swimming pool luxury", "Devrait être différent"),
            ("breakfast coffee morning", "Devrait être différent"),
            ("mediterranean restaurant", "Devrait être différent"),
        ]
        
        print(f"\n🔍 TEST DE VARIÉTÉ AVEC {len(test_cases)} DESCRIPTIONS DIFFÉRENTES:")
        
        results_summary = {}
        
        for i, (query, expected) in enumerate(test_cases, 1):
            print(f"\n--- Test {i}: '{query}' ---")
            print(f"Attendu: {expected}")
            
            matches = ai_matching_service.find_best_matches(
                user_description=query,
                property_description="Hôtel de charme",
                templates=templates,
                top_k=3
            )
            
            if matches:
                top_template = matches[0]['template']
                winner = f"{top_template.hotel_name} ({top_template.country})"
                print(f"🎯 GAGNANT: {winner}")
                print(f"   Score: {matches[0]['similarity_score']:.3f}")
                print(f"   Raison: {matches[0].get('ai_reasoning', 'N/A')}")
                
                # Comptabilise pour l'analyse
                if winner not in results_summary:
                    results_summary[winner] = 0
                results_summary[winner] += 1
                
                # Affiche le top 3 pour voir la différenciation
                print(f"   Top 3:")
                for j, match in enumerate(matches, 1):
                    template = match['template']
                    score = match['similarity_score']
                    print(f"     #{j}: {template.hotel_name} ({template.country}) - {score:.3f}")
            else:
                print("❌ Aucun match trouvé")
        
        print(f"\n📊 ANALYSE DE LA DIVERSITÉ:")
        print(f"Répartition des gagnants sur {len(test_cases)} tests:")
        for winner, count in sorted(results_summary.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / len(test_cases)) * 100
            print(f"  • {winner}: {count}/{len(test_cases)} ({percentage:.1f}%)")
        
        # Analyse du problème
        if len(results_summary) <= 2:
            print(f"\n⚠️  PROBLÈME DÉTECTÉ: Seulement {len(results_summary)} template(s) différent(s) gagnant(s)")
            print("💡 Le système manque de diversité - même template retourné trop souvent")
            return False
        else:
            print(f"\n✅ DIVERSITÉ OK: {len(results_summary)} templates différents gagnants")
            return True
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False
        
    finally:
        db.close()

def analyze_scoring_distribution():
    """Analyse la distribution des scores pour comprendre le problème"""
    print(f"\n🔬 ANALYSE DE LA DISTRIBUTION DES SCORES")
    
    db = SessionLocal()
    try:
        templates = db.query(ViralVideoTemplate).all()
        query = "petit dejeuner francais croissant cuisine"
        
        print(f"Query test: '{query}'")
        
        # Get detailed scoring for all templates
        all_scores = []
        for template in templates:
            analysis = ai_matching_service.analyze_template_match(
                query, 
                "Test property", 
                template
            )
            
            all_scores.append({
                'name': f"{template.hotel_name} ({template.country})",
                'score': analysis['score'],
                'reasoning': analysis['reasoning']
            })
        
        # Sort by score
        all_scores.sort(key=lambda x: x['score'], reverse=True)
        
        print(f"\n📊 SCORES DÉTAILLÉS (triés par score):")
        for i, item in enumerate(all_scores, 1):
            print(f"  #{i}: {item['name']}")
            print(f"       Score: {item['score']:.3f}")
            print(f"       Raison: {item['reasoning']}")
            print()
        
        # Analyze score distribution
        unique_scores = list(set([item['score'] for item in all_scores]))
        print(f"📈 DISTRIBUTION:")
        print(f"   Scores uniques: {len(unique_scores)}")
        print(f"   Score max: {max(unique_scores):.3f}")
        print(f"   Score min: {min(unique_scores):.3f}")
        
        # Count how many templates have the same score
        score_counts = {}
        for score in unique_scores:
            count = len([item for item in all_scores if item['score'] == score])
            score_counts[score] = count
        
        print(f"   Templates par score:")
        for score, count in sorted(score_counts.items(), reverse=True):
            print(f"     {score:.3f}: {count} template(s)")
            
        if len(unique_scores) < 3:
            print(f"\n⚠️  PROBLÈME: Seulement {len(unique_scores)} scores différents")
            print("💡 Tous les templates ont des scores trop similaires")
            
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Debug de la variété des résultats")
    
    # Test principal
    variety_ok = test_result_variety()
    
    # Analyse détaillée des scores
    analyze_scoring_distribution()
    
    if not variety_ok:
        print(f"\n🔧 RECOMMANDATIONS POUR AMÉLIORER LA VARIÉTÉ:")
        print("1. Améliorer la différenciation des scores")
        print("2. Ajouter plus de critères de tie-breaking")  
        print("3. Introduire de la randomisation contrôlée")
        print("4. Utiliser plus de caractéristiques des templates")
    else:
        print(f"\n✅ SYSTÈME DE VARIÉTÉ FONCTIONNEL!")