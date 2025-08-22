#!/usr/bin/env python3
"""
Script pour accès direct à la base de données viral video templates
"""

import sqlite3
import json
import csv
import pandas as pd
from pathlib import Path

DB_PATH = "hospup_saas.db"

def get_connection():
    """Obtenir une connexion à la base de données"""
    return sqlite3.connect(DB_PATH)

def show_all_viral_videos():
    """Afficher toutes les vidéos virales"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, title, hotel_name, username, country, views, likes, 
               comments, followers, duration, category, popularity_score
        FROM viral_video_templates 
        ORDER BY views DESC
    """)
    
    print("📊 TOUTES LES VIDÉOS VIRALES:")
    print("-" * 120)
    print(f"{'ID':<8} {'TITRE':<25} {'HOTEL':<15} {'USERNAME':<15} {'PAYS':<10} {'VUES':<10} {'LIKES':<8} {'SCORE':<5}")
    print("-" * 120)
    
    for row in cursor.fetchall():
        id_short = row[0][:8] if row[0] else ""
        title = (row[1][:22] + "...") if row[1] and len(row[1]) > 25 else (row[1] or "")
        hotel = (row[2][:12] + "...") if row[2] and len(row[2]) > 15 else (row[2] or "")
        username = (row[3][:12] + "...") if row[3] and len(row[3]) > 15 else (row[3] or "")
        country = row[4] or ""
        views = f"{int(row[5]):,}" if row[5] else "0"
        likes = f"{int(row[6]):,}" if row[6] else "0"
        score = f"{row[11]:.1f}" if row[11] else "0"
        
        print(f"{id_short:<8} {title:<25} {hotel:<15} {username:<15} {country:<10} {views:<10} {likes:<8} {score:<5}")
    
    conn.close()

def add_viral_video(title, username, country, video_link, account_link, 
                   followers, views, likes, comments, duration, script_json, 
                   hotel_name="", category="Travel Tips", description="", 
                   popularity_score=5.0):
    """Ajouter une nouvelle vidéo virale"""
    conn = get_connection()
    cursor = conn.cursor()
    
    import uuid
    video_id = str(uuid.uuid4())
    
    cursor.execute("""
        INSERT INTO viral_video_templates 
        (id, title, hotel_name, username, country, video_link, account_link,
         followers, views, likes, comments, duration, script, category, 
         description, popularity_score, is_active, tags, segments_pattern)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        video_id, title, hotel_name, username, country, video_link, account_link,
        followers, views, likes, comments, duration, json.dumps(script_json),
        category, description, popularity_score, True, "[]", "{}"
    ))
    
    conn.commit()
    conn.close()
    print(f"✅ Vidéo ajoutée: {title} (ID: {video_id[:8]})")

def export_to_csv(filename="viral_videos_export.csv"):
    """Exporter toutes les données vers un fichier CSV"""
    conn = get_connection()
    
    df = pd.read_sql_query("""
        SELECT title as 'Titre', hotel_name as 'Hotel', username as 'Username', 
               country as 'Pays', video_link as 'Lien_Video', account_link as 'Lien_Compte',
               followers as 'Followers', views as 'Vues', likes as 'Likes', 
               comments as 'Commentaires', duration as 'Duree', category as 'Categorie',
               popularity_score as 'Score', description as 'Description', 
               tags as 'Tags', script as 'Script'
        FROM viral_video_templates
        ORDER BY views DESC
    """, conn)
    
    df.to_csv(filename, index=False, encoding='utf-8-sig')
    conn.close()
    print(f"📁 Données exportées vers: {filename}")

def import_from_csv(filename):
    """Importer des données depuis un fichier CSV"""
    try:
        df = pd.read_csv(filename)
        conn = get_connection()
        
        for _, row in df.iterrows():
            script_data = {"clips": [], "texts": []}
            if pd.notna(row.get('Script', '')):
                try:
                    script_data = json.loads(row['Script'])
                except:
                    pass
            
            add_viral_video(
                title=row.get('Titre', ''),
                username=row.get('Username', ''),
                country=row.get('Pays', ''),
                video_link=row.get('Lien_Video', ''),
                account_link=row.get('Lien_Compte', ''),
                followers=row.get('Followers', 0),
                views=row.get('Vues', 0),
                likes=row.get('Likes', 0),
                comments=row.get('Commentaires', 0),
                duration=row.get('Duree', 0),
                script_json=script_data,
                hotel_name=row.get('Hotel', ''),
                category=row.get('Categorie', 'Travel Tips'),
                description=row.get('Description', ''),
                popularity_score=row.get('Score', 5.0)
            )
        
        print(f"✅ {len(df)} vidéos importées depuis {filename}")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'import: {e}")

def search_videos(search_term):
    """Rechercher des vidéos"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT title, username, views, likes, popularity_score 
        FROM viral_video_templates 
        WHERE title LIKE ? OR username LIKE ? OR country LIKE ?
        ORDER BY views DESC
    """, (f"%{search_term}%", f"%{search_term}%", f"%{search_term}%"))
    
    print(f"🔍 RÉSULTATS POUR: '{search_term}'")
    print("-" * 80)
    for row in cursor.fetchall():
        title = row[0][:30] if row[0] else ""
        username = row[1] if row[1] else ""
        views = f"{int(row[2]):,}" if row[2] else "0"
        likes = f"{int(row[3]):,}" if row[3] else "0"
        score = f"{row[4]:.1f}" if row[4] else "0"
        print(f"{title:<30} @{username:<15} {views:>10} vues {likes:>8} likes (score: {score})")
    
    conn.close()

def interactive_mode():
    """Mode interactif pour gérer la base de données"""
    while True:
        print("\n" + "="*60)
        print("🗄️  BASE DE DONNÉES VIDÉOS VIRALES")
        print("="*60)
        print("1. Voir toutes les vidéos")
        print("2. Rechercher des vidéos")
        print("3. Ajouter une vidéo")
        print("4. Exporter vers CSV")
        print("5. Importer depuis CSV")
        print("6. Accès SQLite direct")
        print("0. Quitter")
        print("-"*60)
        
        choice = input("Votre choix: ").strip()
        
        if choice == "1":
            show_all_viral_videos()
        
        elif choice == "2":
            term = input("Terme de recherche: ")
            search_videos(term)
        
        elif choice == "3":
            print("\n📝 AJOUTER UNE NOUVELLE VIDÉO:")
            title = input("Titre: ")
            username = input("Username: ")
            country = input("Pays: ")
            video_link = input("Lien vidéo: ")
            account_link = input("Lien compte: ")
            
            try:
                followers = int(input("Followers: ") or "0")
                views = int(input("Vues: ") or "0")
                likes = int(input("Likes: ") or "0")
                comments = int(input("Commentaires: ") or "0")
                duration = float(input("Durée (secondes): ") or "0")
                score = float(input("Score viral (1-10): ") or "5")
            except ValueError:
                print("❌ Erreur: valeurs numériques invalides")
                continue
            
            script_input = input("Script JSON (optionnel, Enter pour passer): ")
            script_json = {"clips": [], "texts": []}
            if script_input.strip():
                try:
                    script_json = json.loads(script_input)
                except:
                    print("⚠️ JSON invalide, script vide utilisé")
            
            add_viral_video(title, username, country, video_link, account_link,
                          followers, views, likes, comments, duration, script_json,
                          popularity_score=score)
        
        elif choice == "4":
            filename = input("Nom du fichier CSV (viral_videos_export.csv): ").strip()
            if not filename:
                filename = "viral_videos_export.csv"
            export_to_csv(filename)
        
        elif choice == "5":
            filename = input("Nom du fichier CSV à importer: ").strip()
            if filename and Path(filename).exists():
                import_from_csv(filename)
            else:
                print("❌ Fichier non trouvé")
        
        elif choice == "6":
            print(f"\n💻 ACCÈS SQLITE DIRECT:")
            print(f"sqlite3 {DB_PATH}")
            print("\nCommandes utiles:")
            print("  .tables                    # Voir toutes les tables")
            print("  .schema viral_video_templates  # Voir la structure")
            print("  SELECT * FROM viral_video_templates LIMIT 5;")
            print("  .quit                      # Quitter SQLite")
            input("\nAppuyez sur Enter pour continuer...")
        
        elif choice == "0":
            print("👋 Au revoir!")
            break
        
        else:
            print("❌ Choix invalide")

if __name__ == "__main__":
    interactive_mode()