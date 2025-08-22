#!/usr/bin/env python3
"""
Test script pour tester la génération d'idées complètement
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "demo@hospup.com"  # Utilisateur existant
PASSWORD = "demo123"  # Mot de passe probable

def test_generate_idea_flow():
    """Test complet du flow de génération d'idées"""
    print("🧪 Test du flow complet 'Generate Idea'")
    
    # 1. Connexion pour obtenir un token
    print("\n1️⃣ Authentification...")
    login_response = requests.post(f"{BASE_URL}/api/v1/auth/login", data={
        "username": USERNAME,
        "password": PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Échec de connexion: {login_response.status_code}")
        print("💡 Crée d'abord un utilisateur de test ou utilise les vraies credentials")
        return False
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Authentification réussie")
    
    # 2. Récupérer les propriétés
    print("\n2️⃣ Récupération des propriétés...")
    properties_response = requests.get(f"{BASE_URL}/api/v1/properties", headers=headers)
    
    if properties_response.status_code != 200:
        print(f"❌ Échec récupération propriétés: {properties_response.status_code}")
        return False
    
    properties = properties_response.json()
    if not properties:
        print("❌ Aucune propriété trouvée")
        print("💡 Ajoute d'abord une propriété de test")
        return False
    
    property_id = properties[0]["id"]
    property_name = properties[0]["name"]
    print(f"✅ Propriété trouvée: {property_name} ({property_id})")
    
    # 3. Récupérer les templates viraux
    print("\n3️⃣ Récupération des templates viraux...")
    templates_response = requests.get(f"{BASE_URL}/api/v1/viral-matching/viral-templates", headers=headers)
    
    if templates_response.status_code != 200:
        print(f"❌ Échec récupération templates: {templates_response.status_code}")
        return False
    
    templates = templates_response.json()
    print(f"✅ {len(templates)} templates viraux trouvés")
    
    # 4. Test Smart Match avec différentes descriptions
    test_descriptions = [
        "petit dejeuner francais croissant cuisine",
        "PLAGE SOLEIL MER",
        "breakfast croissant french cuisine",
        "villa italiana tuscany sunset"
    ]
    
    print("\n4️⃣ Test du Smart Match...")
    for i, description in enumerate(test_descriptions, 1):
        print(f"\n🔍 Test {i}/4: '{description}'")
        
        smart_match_response = requests.post(
            f"{BASE_URL}/api/v1/viral-matching/smart-match",
            headers=headers,
            json={
                "property_id": property_id,
                "user_description": description
            }
        )
        
        if smart_match_response.status_code == 200:
            match = smart_match_response.json()
            print(f"✅ Match trouvé: {match['title']}")
            print(f"   Hôtel: {match.get('tags', ['N/A'])[0] if match.get('tags') else 'N/A'}")
            print(f"   Score: {match['popularity_score']:.1f}")
            print(f"   Vues: {match.get('views', 'N/A')}")
            print(f"   Script disponible: {'✅' if match.get('script') else '❌'}")
            
            # Affiche le début du script si disponible
            if match.get('script'):
                script_preview = match['script'][:100] + "..." if len(match['script']) > 100 else match['script']
                print(f"   Script: {script_preview}")
        else:
            print(f"❌ Échec Smart Match: {smart_match_response.status_code}")
            print(f"   Erreur: {smart_match_response.text}")
    
    print("\n🎉 Test terminé!")
    return True

def test_viral_templates_endpoint():
    """Test spécifique de l'endpoint viral-templates"""
    print("\n🧪 Test endpoint viral-templates sans authentification")
    
    # Test sans authentification
    response = requests.get(f"{BASE_URL}/api/v1/viral-matching/viral-templates")
    print(f"Sans auth: {response.status_code} - {response.text[:50]}...")
    
    return response.status_code == 401  # Doit être non-authentifié

if __name__ == "__main__":
    print("🚀 Tests Generate Idea")
    
    # Test basic endpoint
    print("\n" + "="*50)
    test_viral_templates_endpoint()
    
    # Test complet
    print("\n" + "="*50)
    try:
        success = test_generate_idea_flow()
        if success:
            print("\n✅ Tous les tests réussis!")
        else:
            print("\n❌ Certains tests ont échoué")
    except Exception as e:
        print(f"\n❌ Erreur lors du test: {e}")
        print("💡 Assure-toi que le backend et les données sont correctement configurés")