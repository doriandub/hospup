#!/usr/bin/env python3
"""
Configuration simple d'Airtable pour la synchronisation
"""

print("🚀 CONFIGURATION AIRTABLE SYNC")
print("=" * 40)
print()
print("📋 ÉTAPES À SUIVRE:")
print("1. Va sur: https://airtable.com/create/tokens")
print("2. Crée un 'Personal Access Token'")
print("3. Nom: 'Hospup Sync Token'")
print("4. Scopes: data.records:read + data.records:write + schema.bases:read")
print("5. Bases: Sélectionne ta base avec les vidéos")
print("6. Copie ton token (commence par 'pat...')")
print()
print("🏠 BASE ID:")
print("Dans l'URL de ta base Airtable:")
print("https://airtable.com/appXXXXXXXXXXXXXX/...")
print("Le Base ID = appXXXXXXXXXXXXXX")
print()

# Configuration interactive
api_key = input("🔑 Colle ton Personal Access Token: ").strip()
base_id = input("🏠 Colle ton Base ID (app...): ").strip() 
table_name = input("📋 Nom de ta table Airtable (ex: Viral Videos): ").strip()

if not api_key or not base_id or not table_name:
    print("❌ Informations manquantes!")
    exit(1)

# Ajouter à .env
env_additions = f"""
# Airtable Configuration
AIRTABLE_API_KEY={api_key}
AIRTABLE_BASE_ID={base_id}
AIRTABLE_TABLE_NAME={table_name}
"""

with open('.env', 'a') as f:
    f.write(env_additions)

print()
print("✅ Configuration ajoutée à .env")
print()
print("🔄 Maintenant teste la synchronisation:")
print("python test_airtable_sync.py")