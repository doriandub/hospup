#!/usr/bin/env python3
"""
ACCÈS DIRECT BRUTALE À AWS RDS POSTGRESQL
Script pour ajouter/modifier tes vidéos virales rapidement
"""

import psycopg2
import json
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def connect():
    """Connexion à la base"""
    return psycopg2.connect(DATABASE_URL)

def add_video(title, hotel_name, username, country, video_link, account_link="", 
              followers=0, views=0, likes=0, comments=0, duration=30, 
              category="Hotel Tour", description="", popularity_score=5.0, script=""):
    """Ajouter une vidéo virale rapidement"""
    
    conn = connect()
    cursor = conn.cursor()
    
    script_obj = {"description": script} if script else {"description": description}
    
    cursor.execute('''
        INSERT INTO viral_video_templates 
        (id, title, hotel_name, username, country, video_link, account_link,
         followers, views, likes, comments, duration, script, category, 
         description, popularity_score, tags, segments_pattern, is_active,
         total_duration_min, total_duration_max, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (
        str(uuid.uuid4()), title, hotel_name, username, country, video_link, account_link,
        followers, views, likes, comments, duration, json.dumps(script_obj), category,
        description, popularity_score, json.dumps([]), json.dumps({}), True,
        duration * 0.8, duration * 1.2, datetime.now(), datetime.now()
    ))
    
    conn.commit()
    conn.close()
    print(f"✅ Vidéo '{title}' ajoutée !")

def list_videos():
    """Lister toutes les vidéos"""
    conn = connect()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, title, hotel_name, username, views, likes, popularity_score, created_at
        FROM viral_video_templates 
        ORDER BY created_at DESC
    ''')
    
    print(f"\n🎬 VIDÉOS VIRALES ({cursor.rowcount} total):")
    print("-" * 80)
    for row in cursor.fetchall():
        print(f"{row[1][:40]:<40} | @{row[3] or 'N/A':<12} | {int(row[4] or 0):>8,} vues | Score: {row[6]}/10")
    
    conn.close()

def delete_video(video_id):
    """Supprimer une vidéo"""
    conn = connect()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM viral_video_templates WHERE id = %s', (video_id,))
    conn.commit()
    conn.close()
    
    if cursor.rowcount > 0:
        print(f"✅ Vidéo supprimée !")
    else:
        print(f"❌ Vidéo non trouvée")

def run_sql(query):
    """Exécuter du SQL brut"""
    conn = connect()
    cursor = conn.cursor()
    
    try:
        cursor.execute(query)
        
        if cursor.description:  # SELECT
            results = cursor.fetchall()
            print(f"\n📊 RÉSULTATS ({len(results)} lignes):")
            for row in results:
                print(row)
        else:  # INSERT/UPDATE/DELETE
            conn.commit()
            print(f"✅ Requête exécutée ({cursor.rowcount} lignes affectées)")
            
    except Exception as e:
        print(f"❌ Erreur SQL: {e}")
    
    conn.close()

def interactive_menu():
    """Menu interactif"""
    print("🚀 ACCÈS DIRECT AWS RDS POSTGRESQL")
    print("=" * 50)
    
    while True:
        print(f"\n📋 OPTIONS:")
        print("1. Ajouter vidéo rapidement")
        print("2. Lister toutes les vidéos")
        print("3. Exécuter SQL personnalisé")
        print("4. Quitter")
        
        choice = input("\n👉 Choix (1-4): ").strip()
        
        if choice == "1":
            print(f"\n🎬 AJOUT RAPIDE VIDÉO:")
            title = input("Titre: ").strip()
            hotel = input("Hôtel: ").strip()
            username = input("Username (@user): ").strip()
            country = input("Pays: ").strip() or "France"
            video_link = input("Lien vidéo: ").strip()
            views = int(input("Vues (0): ") or "0")
            likes = int(input("Likes (0): ") or "0")
            score = float(input("Score viral (1-10): ") or "5")
            description = input("Description: ").strip()
            
            if title:
                add_video(title, hotel, username, country, video_link, 
                         views=views, likes=likes, popularity_score=score, description=description)
        
        elif choice == "2":
            list_videos()
        
        elif choice == "3":
            print(f"\n💻 EXÉCUTION SQL:")
            print("Exemples:")
            print("SELECT * FROM viral_video_templates LIMIT 5;")
            print("UPDATE viral_video_templates SET views=1000000 WHERE title LIKE '%Morning%';")
            query = input("\nSQL> ").strip()
            if query:
                run_sql(query)
        
        elif choice == "4":
            print("👋 Au revoir !")
            break
        
        else:
            print("❌ Choix invalide")

if __name__ == "__main__":
    # Exemples rapides
    print("🎯 EXEMPLES D'USAGE:")
    print("python direct_database.py")
    print("")
    
    # Ou lancer le menu interactif
    interactive_menu()