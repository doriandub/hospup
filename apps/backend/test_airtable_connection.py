#!/usr/bin/env python3
"""
Script de test pour explorer la structure Airtable
"""

import os
import logging
from pyairtable import Api

# REMPLACE CES VALEURS PAR TES VRAIES CLÉS
AIRTABLE_API_KEY = "pat2nW4NiGevOD9Zj.ad544908afd213120026c690772887323dc2025780012a03aa2f7613395721d8"
AIRTABLE_BASE_ID = "appWktKeiUfbmhc0U" 
AIRTABLE_TABLE_NAME = "Viral Videos"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_airtable_connection(api_key: str, base_id: str, table_name: str):
    """Test la connexion et explore la structure"""
    try:
        logger.info("🔍 Test de connexion à Airtable...")
        
        # Initialise l'API
        airtable = Api(api_key)
        table = airtable.table(base_id, table_name)
        
        # Récupère les premiers enregistrements pour analyser la structure
        logger.info("📥 Récupération des premiers enregistrements...")
        records = table.all(max_records=3)  # Limite à 3 pour le test
        
        if not records:
            logger.warning("⚠️ Aucun enregistrement trouvé")
            return
        
        logger.info(f"✅ {len(records)} enregistrements trouvés")
        
        # Analyse la structure
        logger.info("\n🔍 ANALYSE DE LA STRUCTURE AIRTABLE:")
        logger.info("="*50)
        
        for i, record in enumerate(records, 1):
            fields = record.get('fields', {})
            logger.info(f"\n📋 ENREGISTREMENT #{i}:")
            logger.info(f"ID: {record.get('id')}")
            logger.info(f"Champs disponibles: {list(fields.keys())}")
            
            # Affiche quelques valeurs exemple
            for field_name, value in fields.items():
                if isinstance(value, str) and len(value) > 100:
                    value_preview = value[:100] + "..."
                else:
                    value_preview = value
                logger.info(f"  {field_name}: {value_preview}")
        
        logger.info("\n" + "="*50)
        logger.info("✅ TEST DE CONNEXION RÉUSSI!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur de connexion: {e}")
        return False

def main():
    if AIRTABLE_API_KEY == "VOTRE_CLE_API":
        print("❌ Configure d'abord AIRTABLE_API_KEY!")
        print("💡 Remplace 'VOTRE_CLE_API' par ta vraie clé API Airtable")
        return
    
    if AIRTABLE_BASE_ID == "VOTRE_BASE_ID":
        print("❌ Configure d'abord AIRTABLE_BASE_ID!")
        print("💡 Remplace 'VOTRE_BASE_ID' par ton vrai base ID")
        return
    
    success = test_airtable_connection(
        AIRTABLE_API_KEY,
        AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_NAME
    )
    
    if success:
        print(f"\n🎉 Connexion réussie!")
        print(f"📝 Maintenant tu peux utiliser ces paramètres dans sync_airtable_full.py")
    else:
        print("\n❌ Échec de connexion")
        print("💡 Vérifie tes clés API et le nom de ta table")

if __name__ == "__main__":
    main()