#!/usr/bin/env python3
"""
Import des vraies vidéos virales depuis ta structure
"""

import psycopg2
import json
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

def import_video_data():
    """Importer les vraies données de vidéos virales"""
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Données extraites de ta capture d'écran
    real_videos = [
        {
            "title": "Beautiful Garden",
            "hotel_name": "Vines on part loin",
            "username": "tensionadialith", 
            "country": "France",
            "video_link": "https://www.instagram.com/p/DNsczfsp8t_it/",
            "account_link": "https://www.instagram.com/tensionadialith/",
            "followers": 295000,
            "views": 1170352,
            "likes": 22506,
            "comments": 299,
            "duration": 12.0,
            "category": "Local Experience",
            "popularity_score": 8.5,
            "description": "Beautiful garden view with cinematic shots",
            "script": {
                "clips": [
                    {
                        "order": 1,
                        "duration": 3.80,
                        "description": "Airplane view of clouds from a window, two figures walking on the clouds, daytime, high angle, wide shot, surreal, cinematic."
                    },
                    {
                        "order": 2, 
                        "duration": 7.30,
                        "description": "Airplane view of clouds from a window, single figure walking on the clouds, daytime, high angle, wide shot, surreal, cinematic."
                    },
                    {
                        "order": 3,
                        "duration": 1.10, 
                        "description": "Airplane view of clouds from a window, group of figures standing on the clouds, daytime, high angle, wide shot, surreal, cinematic."
                    }
                ],
                "voice": [
                    {
                        "content": "DEPUIS SON HUBLOT, ELLE FILME UNE SCÈNE SURRÉALISTE DANS LES NUAGES...",
                        "start": 0.00,
                        "end": 3.80,
                        "position": "center"
                    }
                ],
                "text_elements": {
                    "x": 0.50,
                    "y": 0.10,
                    "font": "Avenir",
                    "size": 24,
                    "weight": 400
                }
            }
        }
        # Tu peux ajouter d'autres vidéos ici
    ]
    
    print(f"🎬 Import de {len(real_videos)} vidéo(s) réelle(s)...")
    
    for video in real_videos:
        try:
            cursor.execute('''
                INSERT INTO viral_video_templates 
                (id, title, hotel_name, username, country, video_link, account_link,
                 followers, views, likes, comments, duration, script, category, 
                 description, popularity_score, tags, segments_pattern, is_active,
                 total_duration_min, total_duration_max, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            ''', (
                str(uuid.uuid4()),
                video["title"],
                video["hotel_name"], 
                video["username"],
                video["country"],
                video["video_link"],
                video["account_link"],
                video["followers"],
                video["views"], 
                video["likes"],
                video["comments"],
                video["duration"],
                json.dumps(video["script"]),
                video["category"],
                video["description"],
                video["popularity_score"],
                json.dumps([]),  # tags vides pour l'instant
                json.dumps({}),  # segments_pattern vide
                True,  # is_active
                video["duration"] * 0.8,  # duration_min
                video["duration"] * 1.2,  # duration_max
                datetime.now(),
                datetime.now()
            ))
            
            print(f"✅ {video['title']} - @{video['username']} - {video['views']:,} vues")
            
        except Exception as e:
            print(f"❌ Erreur pour {video['title']}: {e}")
    
    conn.commit()
    
    # Vérification
    cursor.execute("SELECT COUNT(*) FROM viral_video_templates")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT title, username, views, likes FROM viral_video_templates ORDER BY views DESC LIMIT 5")
    top_videos = cursor.fetchall()
    
    print(f"\n🎉 IMPORT TERMINÉ!")
    print(f"📊 Total vidéos en base: {total}")
    print(f"\n🔥 TOP 5 VIDÉOS (vues):")
    for video in top_videos:
        print(f"  🎬 {video[0][:30]:<30} @{video[1]:<15} {video[2]:>10,} vues")
    
    conn.close()
    return True

def add_single_video(title, hotel_name, username, country, video_link, account_link,
                     followers, views, likes, comments, duration, script_data, 
                     category="Local Experience", popularity_score=8.0):
    """Ajouter une seule vidéo rapidement"""
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO viral_video_templates 
        (id, title, hotel_name, username, country, video_link, account_link,
         followers, views, likes, comments, duration, script, category, 
         description, popularity_score, tags, segments_pattern, is_active,
         total_duration_min, total_duration_max, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (
        str(uuid.uuid4()), title, hotel_name, username, country, video_link, account_link,
        followers, views, likes, comments, duration, json.dumps(script_data), category,
        f"{title} - {hotel_name}", popularity_score, json.dumps([]), json.dumps({}), True,
        duration * 0.8, duration * 1.2, datetime.now(), datetime.now()
    ))
    
    conn.commit()
    conn.close()
    print(f"✅ Vidéo '{title}' ajoutée !")

if __name__ == "__main__":
    print("🚀 IMPORT VIDÉOS VIRALES RÉELLES")
    print("=" * 40)
    
    # Import automatique
    import_video_data()