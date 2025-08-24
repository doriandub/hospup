#!/usr/bin/env python3
"""
Test script for comprehensive Groq AI description generation
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

def test_comprehensive_generation():
    """Test comprehensive Groq description generation with full property info"""
    
    print("🧪 Testing COMPREHENSIVE Groq AI description generation...")
    print("=" * 60)
    
    # Test case 1: Sémaphore de Lervilly with FULL data
    print("Test 1: Sémaphore de Lervilly - DONNÉES COMPLÈTES")
    property1 = MockProperty(
        name="Sémaphore de Lervilly",
        description="Hôtel de charme face à la mer, situé sur la pointe de Lervilly avec vue panoramique sur l'océan Atlantique. Architecture traditionnelle bretonne renovée, restaurant gastronomique, spa et accès direct à la plage privée.",
        city="Quiberon",
        country="France",
        property_type="hotel_charme",
        address="Pointe de Lervilly, 56170 Quiberon, France",
        website_url="https://semaphorelervilly.com",
        phone="+33 2 97 52 39 84",
        instagram_handle="@semaphorelervilly"
    )
    
    description1 = groq_service.generate_instagram_description(
        property_obj=property1,
        user_description="Vidéo pour montrer le coucher de soleil depuis la terrasse avec vue mer"
    )
    print(f"📝 Description: {description1}")
    print("-" * 50)
    
    # Test case 2: Hotel moderne sans beaucoup d'infos
    print("Test 2: Hotel simple - DONNÉES MINIMALES")
    property2 = MockProperty(
        name="Hotel Metropolitan",
        city="Paris",
        country="France",
        property_type="hotel"
    )
    
    description2 = groq_service.generate_instagram_description(
        property_obj=property2,
        user_description="Vidéo pour montrer la réception moderne et le service de qualité"
    )
    print(f"📝 Description: {description2}")
    print("-" * 50)
    
    # Test case 3: Etablissement avec description détaillée
    print("Test 3: Château Hotel - DESCRIPTION RICHE")
    property3 = MockProperty(
        name="Château de Versailles Hotel",
        description="Château historique du 18ème siècle transformé en hôtel de luxe. Jardins à la française, suites royales, restaurant étoilé Michelin et spa dans les anciennes caves voûtées.",
        city="Versailles",
        country="France",
        property_type="chateau_hotel",
        address="1 Rue des Jardins, 78000 Versailles",
        website_url="https://chateauversailleshotel.fr",
        instagram_handle="@chateauversailles"
    )
    
    description3 = groq_service.generate_instagram_description(
        property_obj=property3,
        user_description="Vidéo pour promouvoir notre package romantique avec dîner aux chandelles"
    )
    print(f"📝 Description: {description3}")
    print("-" * 50)
    
    print("✅ Tests terminés!")
    print("\n🎯 L'IA utilise maintenant:")
    print("   • Nom de l'établissement")
    print("   • Description complète de la propriété") 
    print("   • Localisation (ville, pays)")
    print("   • Type d'établissement")
    print("   • Coordonnées (téléphone, site web, Instagram)")
    print("   • Message spécifique de l'utilisateur pour cette vidéo")

if __name__ == "__main__":
    test_comprehensive_generation()