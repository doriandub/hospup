#!/usr/bin/env python3
"""
Import CSV depuis Airtable vers AWS RDS
"""

import pandas as pd
import psycopg2
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

def import_from_csv(csv_file_path):
    """Importer un CSV Airtable vers PostgreSQL"""
    
    # Lire le CSV
    df = pd.read_csv(csv_file_path)
    print(f"📊 {len(df)} lignes trouvées dans le CSV")
    print(f"📋 Colonnes: {list(df.columns)}")
    
    # Connexion base
    DATABASE_URL = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    imported = 0
    
    for index, row in df.iterrows():
        try:
            # Mapping des colonnes (adapte selon ton CSV Airtable)
            title = str(row.get('Title', row.get('title', f'Video {index+1}')))
            hotel_name = str(row.get('Hotel name', row.get('hotel_name', '')))
            username = str(row.get('Username', row.get('username', '')))
            country = str(row.get('Country', row.get('country', 'France')))
            video_link = str(row.get('Video link', row.get('video_link', '')))
            account_link = str(row.get('Account link', row.get('account_link', '')))
            
            # Nombres (gérer les NaN)
            followers = int(row.get('Followers', row.get('followers', 0)) or 0)
            views = int(row.get('Views', row.get('views', 0)) or 0)
            likes = int(row.get('Likes', row.get('likes', 0)) or 0) 
            comments = int(row.get('Comments', row.get('comments', 0)) or 0)
            duration = float(row.get('Duration', row.get('duration', 30)) or 30)
            popularity_score = float(row.get('Score', row.get('popularity_score', 5)) or 5)
            
            # Script/description
            script_content = str(row.get('Script', row.get('script', title)))
            description = str(row.get('Description', row.get('description', title)))
            category = str(row.get('Category', row.get('category', 'Local Experience')))
            
            # Créer le script JSON
            script_obj = {"description": script_content}
            
            # Insertion
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
                duration, json.dumps(script_obj), category, description,
                popularity_score, json.dumps([]), json.dumps({}), True,
                duration * 0.8, duration * 1.2, datetime.now(), datetime.now()
            ))
            
            imported += 1
            print(f"✅ {title} - @{username} - {views:,} vues")
            
        except Exception as e:
            print(f"❌ Erreur ligne {index+1}: {e}")
            continue
    
    conn.commit()
    conn.close()
    
    print(f"\n🎉 IMPORT TERMINÉ!")
    print(f"📊 {imported}/{len(df)} vidéos importées")

if __name__ == "__main__":
    print("🚀 IMPORT CSV AIRTABLE → AWS RDS")
    print("=" * 40)
    
    csv_path = input("Chemin vers ton fichier CSV Airtable: ").strip()
    
    if os.path.exists(csv_path):
        import_from_csv(csv_path)
    else:
        print("❌ Fichier non trouvé!")
        print("💡 Exemple: /Users/ton-nom/Downloads/airtable-export.csv")