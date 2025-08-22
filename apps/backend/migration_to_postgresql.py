#!/usr/bin/env python3
"""
Script de migration SQLite vers PostgreSQL hébergé
"""

import sqlite3
import psycopg2
import json
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

def migrate_sqlite_to_postgresql():
    """Migrer toutes les données de SQLite vers PostgreSQL"""
    
    # Vérifier que DATABASE_URL est configuré
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL non configuré dans .env")
        print("👉 Ajoute: DATABASE_URL=postgresql://username:password@host:port/database")
        return False
    
    if not database_url.startswith('postgresql'):
        print("❌ ERROR: DATABASE_URL doit commencer par 'postgresql://'")
        return False
    
    try:
        # Connexion SQLite (source)
        print("📂 Connexion à SQLite...")
        sqlite_conn = sqlite3.connect('hospup_saas.db')
        sqlite_cursor = sqlite_conn.cursor()
        
        # Vérifier si la table existe dans SQLite
        sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='viral_video_templates'")
        if not sqlite_cursor.fetchone():
            print("❌ Table 'viral_video_templates' non trouvée dans SQLite")
            return False
        
        # Connexion PostgreSQL (destination)
        print("🌐 Connexion à PostgreSQL...")
        pg_conn = psycopg2.connect(database_url)
        pg_cursor = pg_conn.cursor()
        
        # 1. Créer la table PostgreSQL avec la structure complète
        print("🏗️ Création de la table PostgreSQL...")
        pg_cursor.execute('''
            CREATE TABLE IF NOT EXISTS viral_video_templates (
                id VARCHAR PRIMARY KEY,
                title VARCHAR(255),
                hotel_name TEXT,
                username TEXT,
                country TEXT,
                video_link TEXT,
                account_link TEXT,
                followers REAL,
                views REAL,
                likes REAL,
                comments REAL,
                duration REAL,
                script JSONB,
                category VARCHAR(100),
                description TEXT,
                popularity_score FLOAT,
                tags JSONB,
                segments_pattern JSONB,
                is_active BOOLEAN DEFAULT TRUE,
                total_duration_min REAL,
                total_duration_max REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 2. Récupérer la structure de la table SQLite
        sqlite_cursor.execute("PRAGMA table_info(viral_video_templates)")
        sqlite_columns = [col[1] for col in sqlite_cursor.fetchall()]
        print(f"📋 Colonnes SQLite trouvées: {sqlite_columns}")
        
        # 3. Copier les données
        print("📦 Récupération des données SQLite...")
        sqlite_cursor.execute('SELECT * FROM viral_video_templates')
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print("⚠️ Aucune donnée trouvée dans SQLite")
            pg_conn.commit()
            return True
        
        print(f"📊 {len(rows)} vidéos trouvées dans SQLite")
        
        # 4. Préparer l'insertion PostgreSQL
        print("💾 Migration vers PostgreSQL...")
        migrated_count = 0
        
        for row in rows:
            try:
                # Créer un dictionnaire avec les données
                row_dict = dict(zip(sqlite_columns, row))
                
                # Traitement des champs JSON
                script_data = row_dict.get('script', '{}')
                if isinstance(script_data, str):
                    try:
                        script_data = json.loads(script_data) if script_data else {}
                    except:
                        script_data = {}
                
                tags_data = row_dict.get('tags', '[]')
                if isinstance(tags_data, str):
                    try:
                        tags_data = json.loads(tags_data) if tags_data else []
                    except:
                        tags_data = []
                
                segments_data = row_dict.get('segments_pattern', '{}')
                if isinstance(segments_data, str):
                    try:
                        segments_data = json.loads(segments_data) if segments_data else {}
                    except:
                        segments_data = {}
                
                # Générer un ID si manquant
                video_id = row_dict.get('id') or str(uuid.uuid4())
                
                # Convertir is_active en boolean
                is_active_val = row_dict.get('is_active', 1)
                if isinstance(is_active_val, (int, str)):
                    is_active_val = bool(int(is_active_val)) if str(is_active_val).isdigit() else True
                
                # Insérer dans PostgreSQL
                pg_cursor.execute('''
                    INSERT INTO viral_video_templates 
                    (id, title, hotel_name, username, country, video_link, account_link,
                     followers, views, likes, comments, duration, script, category, 
                     description, popularity_score, tags, segments_pattern, is_active,
                     total_duration_min, total_duration_max)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        hotel_name = EXCLUDED.hotel_name,
                        username = EXCLUDED.username,
                        country = EXCLUDED.country,
                        video_link = EXCLUDED.video_link,
                        account_link = EXCLUDED.account_link,
                        followers = EXCLUDED.followers,
                        views = EXCLUDED.views,
                        likes = EXCLUDED.likes,
                        comments = EXCLUDED.comments,
                        duration = EXCLUDED.duration,
                        script = EXCLUDED.script,
                        category = EXCLUDED.category,
                        description = EXCLUDED.description,
                        popularity_score = EXCLUDED.popularity_score,
                        tags = EXCLUDED.tags,
                        segments_pattern = EXCLUDED.segments_pattern,
                        updated_at = CURRENT_TIMESTAMP
                ''', (
                    video_id,
                    row_dict.get('title', ''),
                    row_dict.get('hotel_name', ''),
                    row_dict.get('username', ''),
                    row_dict.get('country', ''),
                    row_dict.get('video_link', ''),
                    row_dict.get('account_link', ''),
                    row_dict.get('followers', 0),
                    row_dict.get('views', 0),
                    row_dict.get('likes', 0),
                    row_dict.get('comments', 0),
                    row_dict.get('duration', 0),
                    json.dumps(script_data),
                    row_dict.get('category', 'Travel Tips'),
                    row_dict.get('description', ''),
                    row_dict.get('popularity_score', 5.0),
                    json.dumps(tags_data),
                    json.dumps(segments_data),
                    is_active_val,
                    row_dict.get('total_duration_min', 15.0),
                    row_dict.get('total_duration_max', 60.0)
                ))
                
                migrated_count += 1
                print(f"✅ Migré: {row_dict.get('title', 'Sans titre')[:30]}")
                
            except Exception as e:
                print(f"❌ Erreur sur une ligne: {e}")
                continue
        
        # 5. Valider la migration
        pg_conn.commit()
        
        # Vérifier le nombre d'enregistrements
        pg_cursor.execute('SELECT COUNT(*) FROM viral_video_templates')
        pg_count = pg_cursor.fetchone()[0]
        
        print(f"\n🎉 MIGRATION TERMINÉE!")
        print(f"📊 {migrated_count}/{len(rows)} vidéos migrées avec succès")
        print(f"🗄️ Total dans PostgreSQL: {pg_count} vidéos")
        
        # Afficher quelques exemples
        print(f"\n📋 APERÇU DES DONNÉES MIGRÉES:")
        pg_cursor.execute('''
            SELECT title, username, views, likes 
            FROM viral_video_templates 
            ORDER BY views DESC LIMIT 5
        ''')
        for row in pg_cursor.fetchall():
            print(f"  🎬 {row[0][:30]:<30} @{row[1]:<15} {int(row[2]):>8,} vues")
        
        sqlite_conn.close()
        pg_conn.close()
        
        print(f"\n🌐 Ta base de données est maintenant hébergée en ligne!")
        print(f"🔗 URL de connexion: {database_url.split('@')[1] if '@' in database_url else 'configurée'}")
        
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Erreur SQLite: {e}")
        return False
    except psycopg2.Error as e:
        print(f"❌ Erreur PostgreSQL: {e}")
        print(f"🔧 Vérifiez votre DATABASE_URL dans .env")
        return False
    except Exception as e:
        print(f"❌ Erreur générale: {e}")
        return False

def test_postgresql_connection():
    """Tester la connexion PostgreSQL"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL non configuré")
        return False
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute('SELECT version()')
        version = cursor.fetchone()[0]
        print(f"✅ Connexion PostgreSQL réussie!")
        print(f"🗄️ Version: {version}")
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connexion PostgreSQL échouée: {e}")
        return False

if __name__ == "__main__":
    print("🚀 MIGRATION SQLite → PostgreSQL HÉBERGÉ")
    print("=" * 50)
    
    # Test de la connexion PostgreSQL
    if not test_postgresql_connection():
        print("\n📋 INSTRUCTIONS:")
        print("1. Créer un compte sur Railway.app")
        print("2. Créer un projet PostgreSQL")
        print("3. Copier DATABASE_URL dans .env")
        print("4. Relancer ce script")
        exit(1)
    
    # Lancer la migration
    if migrate_sqlite_to_postgresql():
        print("\n🎯 PROCHAINES ÉTAPES:")
        print("1. Mettre à jour database.py avec DATABASE_URL")
        print("2. Redémarrer l'application backend")
        print("3. Tester l'interface web")
        print("4. Ta base est maintenant accessible de partout!")
    else:
        print("\n❌ Migration échouée - vérifiez les erreurs ci-dessus")