#!/usr/bin/env python3
"""
Test script for Groq AI description generation
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.groq_service import groq_service

def test_groq_generation():
    """Test Groq description generation"""
    
    print("🧪 Testing Groq AI description generation...")
    print("-" * 50)
    
    # Test case 1: Sémaphore de Lervilly
    print("Test 1: Sémaphore de Lervilly")
    description1 = groq_service.generate_instagram_description(
        property_name="Sémaphore de Lervilly",
        city="Quiberon", 
        country="France",
        user_description="Hôtel de charme face à la mer avec vue panoramique"
    )
    print(f"📝 Description: {description1}")
    print()
    
    # Test case 2: Hotel City
    print("Test 2: Hotel Metropolitan")  
    description2 = groq_service.generate_instagram_description(
        property_name="Hotel Metropolitan",
        city="Paris",
        country="France", 
        user_description="Hotel moderne en centre ville"
    )
    print(f"📝 Description: {description2}")
    print()
    
    # Test case 3: Without user description
    print("Test 3: Sans description utilisateur")
    description3 = groq_service.generate_instagram_description(
        property_name="Château de Versailles Hotel",
        city="Versailles",
        country="France",
        user_description=""
    )
    print(f"📝 Description: {description3}")
    print()
    
    print("✅ Tests terminés!")

if __name__ == "__main__":
    test_groq_generation()