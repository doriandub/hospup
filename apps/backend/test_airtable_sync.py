#!/usr/bin/env python3
"""
Test simple de la synchronisation Airtable
"""

from airtable_sync_service import AirtableSyncService

def test_sync():
    print("🧪 TEST SYNCHRONISATION AIRTABLE")
    print("=" * 40)
    
    service = AirtableSyncService()
    
    # Vérifier la configuration
    if service.airtable_api_key == "TES_AIRTABLE_API_KEY":
        print("❌ Configuration Airtable manquante!")
        print("Lance d'abord: python setup_airtable.py")
        return
    
    print(f"🔑 API Key: {service.airtable_api_key[:10]}...")
    print(f"🏠 Base ID: {service.airtable_base_id}")
    print(f"📋 Table: {service.airtable_table_name}")
    print()
    
    # Test de connexion
    print("🔄 Test de connexion Airtable...")
    records = service.get_airtable_records()
    
    if records:
        print(f"✅ {len(records)} records trouvés dans Airtable!")
        
        # Afficher quelques exemples
        print("\n📊 APERÇU DES DONNÉES:")
        for i, record in enumerate(records[:3]):
            fields = record.get('fields', {})
            title = fields.get('Title', 'Sans titre')
            views = fields.get('Views', 0)
            print(f"  {i+1}. {title} - {views:,} vues")
        
        # Synchroniser vers PostgreSQL
        print(f"\n🔄 Synchronisation vers AWS RDS...")
        synced = service.sync_to_postgresql(records)
        
        if synced:
            print(f"🎉 SYNC RÉUSSIE! {synced} vidéos synchronisées")
            print("\n✅ Tu peux maintenant:")
            print("1. Modifier tes vidéos dans Airtable")
            print("2. Lancer la sync automatique")
            print("3. Voir les changements dans ton app Hospup")
        else:
            print("❌ Erreur lors de la synchronisation")
    else:
        print("❌ Aucune donnée trouvée dans Airtable")
        print("Vérifie:")
        print("- Ton token a les bonnes permissions")
        print("- Ton Base ID est correct")
        print("- Le nom de ta table est exact")

if __name__ == "__main__":
    test_sync()