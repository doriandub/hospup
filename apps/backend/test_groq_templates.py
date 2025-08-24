#!/usr/bin/env python3
"""
Test script for different Groq AI prompt templates
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.groq_service import groq_service

class MockProperty:
    """Mock property object for testing"""
    def __init__(self, **kwargs):
        self.name = kwargs.get('name', 'Test Hotel')
        self.description = kwargs.get('description', None)
        self.city = kwargs.get('city', 'Paris')
        self.country = kwargs.get('country', 'France')
        self.property_type = kwargs.get('property_type', 'hotel')
        self.address = kwargs.get('address', None)
        self.website_url = kwargs.get('website_url', None)
        self.phone = kwargs.get('phone', None)
        self.instagram_handle = kwargs.get('instagram_handle', None)

def test_all_templates():
    """Test all available prompt templates"""
    
    print("🧪 Testing ALL Groq AI prompt templates...")
    print("=" * 70)
    
    # Create a luxury property for testing
    luxury_property = MockProperty(
        name="Château de Versailles Hotel",
        description="Château historique du 18ème siècle transformé en hôtel de luxe. Jardins à la française, suites royales, restaurant étoilé Michelin et spa dans les anciennes caves voûtées.",
        city="Versailles",
        country="France",
        property_type="chateau_hotel",
        address="1 Rue des Jardins, 78000 Versailles",
        website_url="https://chateauversailleshotel.fr",
        instagram_handle="@chateauversailles"
    )
    
    # Get available templates
    templates = groq_service.get_available_templates()
    
    # Test each template
    for template_name in templates:
        print(f"📝 Template: {template_name.upper()}")
        print("-" * 50)
        
        description = groq_service.generate_instagram_description(
            property_obj=luxury_property,
            user_description="Vidéo pour promouvoir notre package romantique avec dîner aux chandelles",
            prompt_template=template_name
        )
        
        print(f"Description: {description}")
        print()
    
    print("✅ Tests terminés!")
    print(f"\n🎯 Templates disponibles: {', '.join(templates)}")
    print("\n💡 Chaque template adapte:")
    print("   • Le ton et le vocabulaire")
    print("   • Les emojis utilisés")
    print("   • Les hashtags recommandés")
    print("   • L'angle marketing ciblé")

if __name__ == "__main__":
    test_all_templates()