#!/usr/bin/env python3
"""
SYNCHRONISATION PARFAITE AIRTABLE → POSTGRESQL
Mapping exact des colonnes selon la structure Airtable
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

class PerfectAirtableSync:
    def __init__(self):
        # Configuration Airtable
        self.airtable_api_key = os.getenv('AIRTABLE_API_KEY')
        self.airtable_base_id = os.getenv('AIRTABLE_BASE_ID')
        self.airtable_table_name = os.getenv('AIRTABLE_TABLE_NAME')
        
        # Configuration PostgreSQL
        self.database_url = os.getenv('DATABASE_URL')
        
        # Headers Airtable
        self.headers = {
            'Authorization': f'Bearer {self.airtable_api_key}',
            'Content-Type': 'application/json'
        }
    
    def ensure_property_column(self):
        """Ajouter la colonne 'property' si elle n'existe pas"""
        conn = psycopg2.connect(self.database_url)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'viral_video_templates' AND column_name = 'property'
            """)
            
            if not cursor.fetchone():
                print("📊 Ajout colonne 'property' à PostgreSQL...")
                cursor.execute("ALTER TABLE viral_video_templates ADD COLUMN property TEXT")
                conn.commit()
                print("✅ Colonne 'property' ajoutée")
            else:
                print("✅ Colonne 'property' déjà présente")
                
        except Exception as e:
            print(f"⚠️ Erreur colonne property: {e}")
        
        conn.close()
    
    def get_airtable_records(self):
        """Récupérer tous les records depuis Airtable"""
        url = f"https://api.airtable.com/v0/{self.airtable_base_id}/{self.airtable_table_name}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            records = data.get('records', [])
            
            print(f"📊 {len(records)} records récupérés depuis Airtable")
            
            # Debug: afficher les champs du premier record
            if records:
                print("🔍 Champs Airtable détectés:")
                fields = records[0].get('fields', {})
                for field_name in fields.keys():
                    print(f"  • {field_name}")
            
            return records
            
        except Exception as e:
            print(f"❌ Erreur Airtable API: {e}")
            return []
    
    def perfect_sync_to_postgresql(self, records):
        """Synchronisation parfaite avec mapping exact"""
        
        # S'assurer que la colonne property existe
        self.ensure_property_column()
        
        conn = psycopg2.connect(self.database_url)
        cursor = conn.cursor()
        
        # Vider les anciennes données sync
        cursor.execute("DELETE FROM viral_video_templates WHERE hotel_name IS NOT NULL")
        print("🗑️ Anciennes données nettoyées")
        
        synced = 0
        
        for record in records:
            try:
                fields = record.get('fields', {})
                
                # MAPPING EXACT AIRTABLE → POSTGRESQL
                title = str(fields.get('Title', fields.get('title', 'Sans titre')))
                hotel_name = str(fields.get('Hotel name', ''))
                username = str(fields.get('Username', ''))
                property_name = str(fields.get('Property', ''))  # Nouveau champ
                country = str(fields.get('Country', 'France'))
                video_link = str(fields.get('Video link', ''))
                account_link = str(fields.get('Account link', ''))
                
                # Nombres avec gestion des None/NaN
                followers = self.safe_int(fields.get('Followers', 0))
                views = self.safe_int(fields.get('Views', 0))
                likes = self.safe_int(fields.get('Likes', 0))
                comments = self.safe_int(fields.get('Comments', 0))
                duration = self.safe_float(fields.get('Duration', 30))
                
                # Script et description
                script_content = str(fields.get('Script', ''))
                
                # Script JSON bien formaté
                if script_content and script_content != 'nan':
                    try:
                        # Si c'est déjà du JSON, le parser
                        script_obj = json.loads(script_content) if script_content.startswith('{') else {"description": script_content}
                    except:
                        script_obj = {"description": script_content}
                else:
                    script_obj = {"description": title}
                
                # Catégorie automatique basée sur les données
                category = self.detect_category(title, script_content, hotel_name)
                
                # Score de popularité basé sur les métriques
                popularity_score = self.calculate_popularity_score(views, likes, followers)
                
                # Insertion PostgreSQL avec TOUS les champs
                cursor.execute('''
                    INSERT INTO viral_video_templates 
                    (id, title, hotel_name, username, property, country, video_link, account_link,
                     followers, views, likes, comments, duration, script, category, 
                     description, popularity_score, tags, segments_pattern, is_active,
                     total_duration_min, total_duration_max, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    str(uuid.uuid4()), title, hotel_name, username, property_name, country,
                    video_link, account_link, followers, views, likes, comments,
                    duration, json.dumps(script_obj), category, title,
                    popularity_score, json.dumps([]), json.dumps({}), True,
                    duration * 0.8, duration * 1.2, datetime.now(), datetime.now()
                ))
                
                synced += 1
                print(f"✅ {title[:30]:<30} @{username:<15} {views:>8,} vues")
                
            except Exception as e:
                print(f"❌ Erreur record: {e}")
                continue
        
        conn.commit()
        conn.close()
        
        print(f"\n🎉 SYNC PARFAITE TERMINÉE: {synced} vidéos synchronisées")
        return synced
    
    def safe_int(self, value):
        """Conversion sécurisée en int"""
        try:
            if value is None or str(value).lower() in ['nan', 'none', '']:
                return 0
            return int(float(str(value)))
        except:
            return 0
    
    def safe_float(self, value):
        """Conversion sécurisée en float"""
        try:
            if value is None or str(value).lower() in ['nan', 'none', '']:
                return 30.0
            return float(str(value))
        except:
            return 30.0
    
    def detect_category(self, title, script, hotel_name):
        """Détecter automatiquement la catégorie"""
        text = f"{title} {script} {hotel_name}".lower()
        
        if any(word in text for word in ['morning', 'matin', 'routine']):
            return 'Morning Routine'
        elif any(word in text for word in ['tour', 'room', 'chambre']):
            return 'Hotel Tour'
        elif any(word in text for word in ['pool', 'beach', 'piscine', 'plage']):
            return 'Pool/Beach'
        elif any(word in text for word in ['food', 'restaurant', 'eat']):
            return 'Food & Drinks'
        elif any(word in text for word in ['spa', 'wellness', 'massage']):
            return 'Wellness/Spa'
        else:
            return 'Local Experience'
    
    def calculate_popularity_score(self, views, likes, followers):
        """Calculer le score de popularité basé sur les métriques"""
        if views == 0:
            return 5.0
        
        # Ratio engagement (likes/views)
        engagement_ratio = likes / views if views > 0 else 0
        
        # Score basé sur les vues (logarithmique)
        if views > 1000000:
            base_score = 9.0
        elif views > 500000:
            base_score = 8.0
        elif views > 100000:
            base_score = 7.0
        elif views > 50000:
            base_score = 6.0
        else:
            base_score = 5.0
        
        # Ajustement basé sur l'engagement
        if engagement_ratio > 0.05:  # Plus de 5% de likes
            base_score += 1.0
        elif engagement_ratio > 0.02:  # Plus de 2% de likes
            base_score += 0.5
        
        return min(10.0, base_score)  # Cap à 10
    
    def run_perfect_sync(self):
        """Lancer une synchronisation parfaite"""
        print("🚀 SYNCHRONISATION PARFAITE AIRTABLE → AWS RDS")
        print("=" * 60)
        
        # Récupérer depuis Airtable
        records = self.get_airtable_records()
        
        if records:
            # Synchroniser vers PostgreSQL avec mapping parfait
            synced = self.perfect_sync_to_postgresql(records)
            
            # Vérification finale
            conn = psycopg2.connect(self.database_url)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM viral_video_templates")
            total = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT title, username, property, views, likes, popularity_score 
                FROM viral_video_templates 
                WHERE hotel_name IS NOT NULL 
                ORDER BY views DESC LIMIT 5
            """)
            top_videos = cursor.fetchall()
            conn.close()
            
            print(f"\n📊 RÉSULTATS:")
            print(f"✅ Total en base: {total} vidéos")
            print(f"🔄 Synchronisées: {synced} vidéos")
            print(f"⏰ Dernière sync: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            print(f"\n🔥 TOP 5 VIDÉOS SYNC:")
            for video in top_videos:
                title, username, prop, views, likes, score = video
                print(f"  🎬 {title[:25]:<25} @{username:<12} {prop:<15} {int(views):>8,}v Score:{score:.1f}")
        
        return len(records) > 0

if __name__ == "__main__":
    print("🎯 SYNCHRONISATION PARFAITE AIRTABLE")
    print("=" * 50)
    
    sync = PerfectAirtableSync()
    sync.run_perfect_sync()