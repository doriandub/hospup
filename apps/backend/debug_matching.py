#!/usr/bin/env python3
"""
Debug script to test the AI matching service directly
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.ai_matching_service import ai_matching_service
from models.viral_video_template import ViralVideoTemplate
from core.database import SessionLocal
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

def test_matching():
    """Test the AI matching for French cuisine queries"""
    db = SessionLocal()
    
    try:
        # Get all templates
        templates = db.query(ViralVideoTemplate).all()
        print(f"Found {len(templates)} templates")
        
        # Test queries that should match "Les Oliviers de Redhouse"
        test_queries = [
            "petit dejeuner francais croissant cuisine",
            "PLAGE SOLEIL MER",
            "breakfast croissant french cuisine"
        ]
        
        for query in test_queries:
            print(f"\n{'='*60}")
            print(f"Testing query: '{query}'")
            print(f"{'='*60}")
            
            # Find matches
            matches = ai_matching_service.find_best_matches(
                user_description=query,
                property_description="Hôtel français de charme",
                templates=templates,
                top_k=3
            )
            
            print(f"Found {len(matches)} matches:")
            for i, match in enumerate(matches):
                template = match['template']
                print(f"  #{i+1}: {template.hotel_name} - Score: {match['similarity_score']:.3f}")
                if 'ai_reasoning' in match:
                    print(f"      Reasoning: {match['ai_reasoning']}")
            
            # Special focus on Les Oliviers
            oliviers_templates = [t for t in templates if 'Oliviers' in (t.hotel_name or '')]
            if oliviers_templates:
                print(f"\nDirect analysis of Les Oliviers template:")
                oliviers = oliviers_templates[0]
                analysis = ai_matching_service.analyze_template_match(
                    query, 
                    "Hôtel français de charme", 
                    oliviers
                )
                print(f"  Score: {analysis['score']:.3f}")
                print(f"  Reasoning: {analysis['reasoning']}")
                
                # Check script content
                script_content = ai_matching_service.extract_script_content(oliviers.script or '')
                print(f"  Script content: {script_content[:200]}...")
    
    finally:
        db.close()

if __name__ == "__main__":
    test_matching()