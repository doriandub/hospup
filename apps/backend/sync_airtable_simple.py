#!/usr/bin/env python3
"""
Synchronisation SIMPLE Airtable → PostgreSQL
SEULEMENT les colonnes Airtable, rien d'autre
"""

import requests
import psycopg2
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def sync_simple():
    """Synchronisation simple et directe"""
    
    # Configuration
    api_key = os.getenv('AIRTABLE_API_KEY')
    base_id = os.getenv('AIRTABLE_BASE_ID')
    table_name = os.getenv('AIRTABLE_TABLE_NAME')
    database_url = os.getenv('DATABASE_URL')
    
    print("🔄 SYNC SIMPLE AIRTABLE → POSTGRESQL")
    print("=" * 45)
    
    # 1. Récupérer depuis Airtable
    headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
    url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        records = response.json().get('records', [])
        print(f"📊 {len(records)} vidéos récupérées d'Airtable")
        
    except Exception as e:
        print(f"❌ Erreur Airtable: {e}")
        return
    
    # 2. Synchroniser vers PostgreSQL
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Vider les données existantes
    cursor.execute("DELETE FROM viral_video_templates")
    print("🗑️ Table nettoyée")
    
    synced = 0
    
    for record in records:
        try:
            fields = record.get('fields', {})
            
            # Mapping DIRECT des colonnes Airtable
            title = fields.get('Title', 'Sans titre')
            hotel_name = fields.get('Hotel name', '')
            username = fields.get('Username', '')
            property_val = fields.get('Property', '')
            country = fields.get('Country', '')
            video_link = fields.get('Video link', '')
            account_link = fields.get('Account link', '')
            followers = int(fields.get('Followers', 0) or 0)
            views = int(fields.get('Views', 0) or 0)
            likes = int(fields.get('Likes', 0) or 0)
            comments = int(fields.get('Comments', 0) or 0)
            duration = float(fields.get('Duration', 30) or 30)
            script = fields.get('Script', '')
            audio_url = fields.get('Audio', '')
            
            # Insertion SIMPLE avec audio_url
            cursor.execute('''
                INSERT INTO viral_video_templates 
                (title, hotel_name, username, property, country, video_link, account_link,
                 followers, views, likes, comments, duration, script, audio_url, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                title, hotel_name, username, property_val, country, video_link, account_link,
                followers, views, likes, comments, duration, script, audio_url, datetime.now()
            ))
            
            synced += 1
            print(f"✅ {title[:25]:<25} @{username:<15} {views:>8,} vues")
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            continue
    
    conn.commit()
    
    # Vérification
    cursor.execute("SELECT COUNT(*) FROM viral_video_templates")
    total = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT title, username, property, views 
        FROM viral_video_templates 
        ORDER BY views DESC LIMIT 5
    """)
    top_videos = cursor.fetchall()
    
    conn.close()
    
    print(f"\n🎉 SYNCHRONISATION SIMPLE TERMINÉE!")
    print(f"✅ {synced} vidéos synchronisées")
    print(f"📊 Total en base: {total}")
    
    print(f"\n🔥 TOP 5 VIDÉOS:")
    for video in top_videos:
        title, username, prop, views = video
        print(f"  🎬 {title[:20]:<20} @{username:<12} {prop:<8} {int(views):>8,}v")

if __name__ == "__main__":
    sync_simple()