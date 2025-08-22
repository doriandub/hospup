#!/usr/bin/env python3
"""
Accès direct à la base de données PostgreSQL hébergée
"""

import psycopg2
import pandas as pd
import json
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

def get_postgresql_connection():
    """Obtenir une connexion PostgreSQL"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL non configuré dans .env")
        return None
    return psycopg2.connect(database_url)

def show_all_viral_videos():
    """Afficher toutes les vidéos virales PostgreSQL"""
    try:
        conn = get_postgresql_connection()
        if not conn:
            return
        
        query = '''
            SELECT id, title, hotel_name, username, country, views, likes, 
                   comments, followers, duration, category, popularity_score
            FROM viral_video_templates 
            ORDER BY views DESC
        '''
        
        df = pd.read_sql(query, conn)
        
        print("📊 TOUTES LES VIDÉOS VIRALES (PostgreSQL):")
        print("-" * 120)
        print(f"{'ID':<8} {'TITRE':<25} {'HOTEL':<15} {'USERNAME':<15} {'PAYS':<10} {'VUES':<10} {'LIKES':<8} {'SCORE':<5}")
        print("-" * 120)
        
        for _, row in df.iterrows():
            id_short = str(row['id'])[:8] if row['id'] else ""
            title = (str(row['title'])[:22] + "...") if pd.notna(row['title']) and len(str(row['title'])) > 25 else (str(row['title']) if pd.notna(row['title']) else "")
            hotel = (str(row['hotel_name'])[:12] + "...") if pd.notna(row['hotel_name']) and len(str(row['hotel_name'])) > 15 else (str(row['hotel_name']) if pd.notna(row['hotel_name']) else "")
            username = (str(row['username'])[:12] + "...") if pd.notna(row['username']) and len(str(row['username'])) > 15 else (str(row['username']) if pd.notna(row['username']) else "")
            country = str(row['country']) if pd.notna(row['country']) else ""
            views = f"{int(row['views']):,}" if pd.notna(row['views']) else "0"
            likes = f"{int(row['likes']):,}" if pd.notna(row['likes']) else "0"
            score = f"{float(row['popularity_score']):.1f}" if pd.notna(row['popularity_score']) else "0"
            
            print(f"{id_short:<8} {title:<25} {hotel:<15} {username:<15} {country:<10} {views:<10} {likes:<8} {score:<5}")
        
        print(f"\n📊 Total: {len(df)} vidéos dans PostgreSQL")
        conn.close()
        
    except Exception as e:
        print(f"❌ Erreur: {e}")

def add_viral_video_postgresql(title, username, country, video_link, account_link, 
                              followers, views, likes, comments, duration, script_json, 
                              hotel_name="", category="Travel Tips", description="", 
                              popularity_score=5.0):
    """Ajouter une nouvelle vidéo virale dans PostgreSQL"""
    try:
        conn = get_postgresql_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        video_id = str(uuid.uuid4())
        
        cursor.execute('''
            INSERT INTO viral_video_templates 
            (id, title, hotel_name, username, country, video_link, account_link,
             followers, views, likes, comments, duration, script, category, 
             description, popularity_score, is_active, tags, segments_pattern)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            video_id, title, hotel_name, username, country, video_link, account_link,
            followers, views, likes, comments, duration, json.dumps(script_json),
            category, description, popularity_score, True, json.dumps([]), json.dumps({})
        ))
        
        conn.commit()
        conn.close()
        print(f"✅ Vidéo ajoutée: {title} (ID: {video_id[:8]})")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'ajout: {e}")

def export_to_csv_postgresql(filename="viral_videos_postgresql_export.csv"):
    """Exporter toutes les données PostgreSQL vers CSV"""
    try:
        conn = get_postgresql_connection()
        if not conn:
            return
        
        query = '''
            SELECT title as "Titre", hotel_name as "Hotel", username as "Username", 
                   country as "Pays", video_link as "Lien_Video", account_link as "Lien_Compte",
                   followers as "Followers", views as "Vues", likes as "Likes", 
                   comments as "Commentaires", duration as "Duree", category as "Categorie",
                   popularity_score as "Score", description as "Description", 
                   tags as "Tags", script as "Script"
            FROM viral_video_templates
            ORDER BY views DESC
        '''
        
        df = pd.read_sql(query, conn)
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        conn.close()
        print(f"📁 Données PostgreSQL exportées vers: {filename}")
        print(f"📊 {len(df)} lignes exportées")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'export: {e}")

def import_from_csv_postgresql(filename):
    """Importer des données depuis CSV vers PostgreSQL"""
    try:
        if not os.path.exists(filename):
            print(f"❌ Fichier {filename} non trouvé")
            return
        
        df = pd.read_csv(filename)
        conn = get_postgresql_connection()
        if not conn:
            return
        
        for _, row in df.iterrows():
            script_data = {"clips": [], "texts": []}
            if pd.notna(row.get('Script', '')):
                try:
                    script_data = json.loads(row['Script'])
                except:
                    pass
            
            add_viral_video_postgresql(
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

def search_videos_postgresql(search_term):
    """Rechercher des vidéos dans PostgreSQL"""
    try:
        conn = get_postgresql_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        cursor.execute('''
            SELECT title, username, views, likes, popularity_score 
            FROM viral_video_templates 
            WHERE title ILIKE %s OR username ILIKE %s OR country ILIKE %s
            ORDER BY views DESC
        ''', (f"%{search_term}%", f"%{search_term}%", f"%{search_term}%"))
        
        print(f"🔍 RÉSULTATS POSTGRESQL POUR: '{search_term}'")
        print("-" * 80)
        for row in cursor.fetchall():
            title = row[0][:30] if row[0] else ""
            username = row[1] if row[1] else ""
            views = f"{int(row[2]):,}" if row[2] else "0"
            likes = f"{int(row[3]):,}" if row[3] else "0"
            score = f"{row[4]:.1f}" if row[4] else "0"
            print(f"{title:<30} @{username:<15} {views:>10} vues {likes:>8} likes (score: {score})")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Erreur lors de la recherche: {e}")

def get_database_stats():
    """Afficher les statistiques de la base PostgreSQL"""
    try:
        conn = get_postgresql_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        
        # Total des vidéos
        cursor.execute('SELECT COUNT(*) FROM viral_video_templates')
        total_videos = cursor.fetchone()[0]
        
        # Top catégories
        cursor.execute('''
            SELECT category, COUNT(*) as count 
            FROM viral_video_templates 
            GROUP BY category 
            ORDER BY count DESC 
            LIMIT 5
        ''')
        categories = cursor.fetchall()
        
        # Total vues
        cursor.execute('SELECT SUM(views) FROM viral_video_templates WHERE views IS NOT NULL')
        total_views = cursor.fetchone()[0] or 0
        
        # Vidéo la plus virale
        cursor.execute('''
            SELECT title, views, username 
            FROM viral_video_templates 
            WHERE views IS NOT NULL 
            ORDER BY views DESC 
            LIMIT 1
        ''')
        top_video = cursor.fetchone()
        
        print("📊 STATISTIQUES BASE POSTGRESQL:")
        print("=" * 50)
        print(f"🎬 Total vidéos: {total_videos:,}")
        print(f"👁️ Total vues: {int(total_views):,}")
        if top_video:
            print(f"🏆 Plus virale: {top_video[0]} ({int(top_video[1]):,} vues)")
        
        print(f"\n📋 Top catégories:")
        for cat, count in categories:
            print(f"  • {cat}: {count} vidéos")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Erreur: {e}")

def interactive_mode_postgresql():
    """Mode interactif pour gérer PostgreSQL"""
    while True:
        print("\n" + "="*60)
        print("🌐 BASE DE DONNÉES POSTGRESQL HÉBERGÉE")
        print("="*60)
        print("1. Voir toutes les vidéos")
        print("2. Rechercher des vidéos")
        print("3. Ajouter une vidéo")
        print("4. Exporter vers CSV")
        print("5. Importer depuis CSV")
        print("6. Statistiques de la base")
        print("7. Informations de connexion")
        print("0. Quitter")
        print("-"*60)
        
        choice = input("Votre choix: ").strip()
        
        if choice == "1":
            show_all_viral_videos()
        
        elif choice == "2":
            term = input("Terme de recherche: ")
            search_videos_postgresql(term)
        
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
            
            add_viral_video_postgresql(title, username, country, video_link, account_link,
                                     followers, views, likes, comments, duration, script_json,
                                     popularity_score=score)
        
        elif choice == "4":
            filename = input("Nom du fichier CSV (viral_videos_postgresql_export.csv): ").strip()
            if not filename:
                filename = "viral_videos_postgresql_export.csv"
            export_to_csv_postgresql(filename)
        
        elif choice == "5":
            filename = input("Nom du fichier CSV à importer: ").strip()
            if filename:
                import_from_csv_postgresql(filename)
            else:
                print("❌ Nom de fichier requis")
        
        elif choice == "6":
            get_database_stats()
        
        elif choice == "7":
            database_url = os.getenv('DATABASE_URL', 'Non configuré')
            if '@' in database_url:
                # Masquer le mot de passe
                parts = database_url.split('@')
                host_info = parts[1] if len(parts) > 1 else ''
                print(f"\n🔗 CONNEXION POSTGRESQL:")
                print(f"🌐 Host: {host_info}")
                print(f"✅ Statut: Connecté")
            else:
                print(f"\n❌ DATABASE_URL non configuré")
            
            input("\nAppuyez sur Enter pour continuer...")
        
        elif choice == "0":
            print("👋 Au revoir!")
            break
        
        else:
            print("❌ Choix invalide")

if __name__ == "__main__":
    # Tester la connexion
    try:
        conn = get_postgresql_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute('SELECT version()')
            version = cursor.fetchone()[0]
            print(f"✅ Connexion PostgreSQL active!")
            print(f"📊 {version}")
            conn.close()
            print()
            interactive_mode_postgresql()
        else:
            print("❌ Impossible de se connecter à PostgreSQL")
            print("🔧 Vérifiez DATABASE_URL dans .env")
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        print("📋 Suivez les instructions dans HOSTED_DATABASE_SETUP.md")