#!/usr/bin/env python3
"""
SERVICE DE SYNCHRONISATION AIRTABLE ↔ AWS RDS
Architecture: Airtable → API → PostgreSQL → Hospup App
"""

import requests
import psycopg2
import json
import os
from datetime import datetime
import uuid
import time
from dotenv import load_dotenv

load_dotenv()

class AirtableSyncService:
    def __init__(self):
        # Configuration Airtable depuis .env ou paramètres
        self.airtable_api_key = os.getenv('AIRTABLE_API_KEY', "TES_AIRTABLE_API_KEY")
        self.airtable_base_id = os.getenv('AIRTABLE_BASE_ID', "TON_BASE_ID")
        self.airtable_table_name = os.getenv('AIRTABLE_TABLE_NAME', "Viral Videos")
        
        # Configuration PostgreSQL
        self.database_url = os.getenv('DATABASE_URL')
        
        # Headers Airtable
        self.headers = {
            'Authorization': f'Bearer {self.airtable_api_key}',
            'Content-Type': 'application/json'
        }
    
    def get_airtable_records(self):
        """Récupérer tous les records depuis Airtable"""
        url = f"https://api.airtable.com/v0/{self.airtable_base_id}/{self.airtable_table_name}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            records = data.get('records', [])
            
            print(f"📊 {len(records)} records récupérés depuis Airtable")
            return records
            
        except Exception as e:
            print(f"❌ Erreur Airtable API: {e}")
            return []
    
    def sync_to_postgresql(self, records):
        """Synchroniser les records Airtable vers PostgreSQL"""
        
        conn = psycopg2.connect(self.database_url)
        cursor = conn.cursor()
        
        # Vider la table existante (ou faire un upsert plus smart)
        cursor.execute("DELETE FROM viral_video_templates WHERE hotel_name IS NOT NULL")
        print("🗑️ Table vidéos nettoyée")
        
        synced = 0
        
        for record in records:
            try:
                fields = record.get('fields', {})
                
                # Mapping Airtable → PostgreSQL
                title = fields.get('Title', 'Untitled')
                hotel_name = fields.get('Hotel name', '')
                username = fields.get('Username', '')
                country = fields.get('Country', 'France')
                video_link = fields.get('Video link', '')
                account_link = fields.get('Account link', '')
                followers = int(fields.get('Followers', 0) or 0)
                views = int(fields.get('Views', 0) or 0)
                likes = int(fields.get('Likes', 0) or 0)
                comments = int(fields.get('Comments', 0) or 0)
                duration = float(fields.get('Duration', 30) or 30)
                script_content = fields.get('Script', '')
                category = fields.get('Category', 'Local Experience')
                popularity_score = float(fields.get('Score', 5) or 5)
                
                # Script JSON
                script_obj = {"description": script_content}
                
                # Insertion PostgreSQL
                cursor.execute('''
                    INSERT INTO viral_video_templates 
                    (id, title, hotel_name, username, country, video_link, account_link,
                     followers, views, likes, comments, duration, script, category, 
                     description, popularity_score, tags, segments_pattern, is_active,
                     total_duration_min, total_duration_max, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    str(uuid.uuid4()), title, hotel_name, username, country,
                    video_link, account_link, followers, views, likes, comments,
                    duration, json.dumps(script_obj), category, title,
                    popularity_score, json.dumps([]), json.dumps({}), True,
                    duration * 0.8, duration * 1.2, datetime.now(), datetime.now()
                ))
                
                synced += 1
                print(f"✅ {title} - @{username}")
                
            except Exception as e:
                print(f"❌ Erreur record: {e}")
                continue
        
        conn.commit()
        conn.close()
        
        print(f"\n🎉 SYNC TERMINÉE: {synced} vidéos synchronisées")
        return synced
    
    def run_sync(self):
        """Lancer une synchronisation complète"""
        print("🚀 DÉMARRAGE SYNC AIRTABLE → AWS RDS")
        print("=" * 50)
        
        # Récupérer depuis Airtable
        records = self.get_airtable_records()
        
        if records:
            # Synchroniser vers PostgreSQL
            synced = self.sync_to_postgresql(records)
            
            # Vérification
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM viral_video_templates")
            total = cursor.fetchone()[0]
            conn.close()
            
            print(f"📊 Total en base: {total} vidéos")
            print(f"🔄 Dernière sync: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return len(records) > 0
    
    def start_continuous_sync(self, interval_minutes=10):
        """Synchronisation continue toutes les X minutes"""
        print(f"🔄 SYNC CONTINUE (toutes les {interval_minutes} min)")
        
        while True:
            try:
                success = self.run_sync()
                if success:
                    print(f"⏰ Prochaine sync dans {interval_minutes} min...")
                else:
                    print(f"⚠️ Sync échouée, retry dans {interval_minutes} min...")
                
                time.sleep(interval_minutes * 60)
                
            except KeyboardInterrupt:
                print("\n👋 Arrêt du service de sync")
                break
            except Exception as e:
                print(f"❌ Erreur générale: {e}")
                time.sleep(60)  # Attendre 1 min avant retry

# Configuration Airtable
def setup_airtable_config():
    """Assistant de configuration Airtable"""
    print("🔧 CONFIGURATION AIRTABLE API")
    print("=" * 40)
    print("1. Va sur https://airtable.com/create/tokens")
    print("2. Crée un Personal Access Token")
    print("3. Donne accès à ta base Viral Videos")
    print("4. Copie ton token et Base ID")
    print("")
    print("💡 Base ID se trouve dans l'URL:")
    print("   https://airtable.com/appXXXXXXXXXXXXXX/...")
    print("   → appXXXXXXXXXXXXXX est ton Base ID")
    print("")
    
    api_key = input("🔑 Personal Access Token: ").strip()
    base_id = input("🏠 Base ID (app...): ").strip()
    table_name = input("📋 Nom de ta table (default: Viral Videos): ").strip() or "Viral Videos"
    
    # Sauvegarder dans .env
    env_content = f"""
# Airtable Configuration
AIRTABLE_API_KEY={api_key}
AIRTABLE_BASE_ID={base_id}
AIRTABLE_TABLE_NAME={table_name}
"""
    
    with open('.env', 'a') as f:
        f.write(env_content)
    
    print("✅ Configuration sauvegardée dans .env")
    return api_key, base_id, table_name

if __name__ == "__main__":
    print("🔄 AIRTABLE ↔ AWS RDS SYNC SERVICE")
    print("=" * 50)
    
    choice = input("Configuration (1) ou Sync test (2) ou Sync continue (3) ? ").strip()
    
    if choice == "1":
        setup_airtable_config()
    elif choice == "2":
        service = AirtableSyncService()
        service.run_sync()
    elif choice == "3":
        interval = int(input("Intervalle sync (minutes, default 10): ") or "10")
        service = AirtableSyncService()
        service.start_continuous_sync(interval)
    else:
        print("❌ Choix invalide")