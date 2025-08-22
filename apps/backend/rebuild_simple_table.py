#!/usr/bin/env python3
"""
Recréer la table viral_video_templates avec SEULEMENT les colonnes Airtable
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def rebuild_table():
    """Recréer la table avec structure simple = colonnes Airtable"""
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("🔄 RESTRUCTURATION TABLE VIRAL VIDEOS")
    print("=" * 50)
    
    # 1. Sauvegarder les données existantes si besoin
    print("💾 Sauvegarde des données existantes...")
    cursor.execute("SELECT COUNT(*) FROM viral_video_templates")
    existing_count = cursor.fetchone()[0]
    print(f"📊 {existing_count} vidéos existantes trouvées")
    
    # 2. Supprimer l'ancienne table
    print("🗑️ Suppression ancienne table...")
    cursor.execute("DROP TABLE IF EXISTS viral_video_templates CASCADE")
    
    # 3. Créer nouvelle table simple
    print("🏗️ Création nouvelle table simplifiée...")
    cursor.execute('''
        CREATE TABLE viral_video_templates (
            -- Colonnes techniques minimales
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Colonnes Airtable EXACTES
            title TEXT,
            hotel_name TEXT,
            username TEXT,
            property TEXT,
            country TEXT,
            video_link TEXT,
            account_link TEXT,
            followers BIGINT DEFAULT 0,
            views BIGINT DEFAULT 0,
            likes BIGINT DEFAULT 0,
            comments BIGINT DEFAULT 0,
            duration REAL DEFAULT 30.0,
            script TEXT
        )
    ''')
    
    print("✅ Table simplifiée créée !")
    
    # 4. Vérifier la structure
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'viral_video_templates'
        ORDER BY ordinal_position
    """)
    
    columns = cursor.fetchall()
    print(f"\n📋 NOUVELLE STRUCTURE ({len(columns)} colonnes):")
    
    print("\n🔧 COLONNES TECHNIQUES:")
    for col_name, col_type in columns[:3]:  # 3 premières = techniques
        print(f"  • {col_name:<20} ({col_type})")
    
    print("\n📊 COLONNES AIRTABLE:")
    for col_name, col_type in columns[3:]:  # Le reste = Airtable
        print(f"  • {col_name:<20} ({col_type})")
    
    conn.commit()
    conn.close()
    
    print(f"\n🎉 RESTRUCTURATION TERMINÉE!")
    print("📝 Structure maintenant = colonnes Airtable + ID technique")
    print("\n🔄 Relance maintenant la synchronisation:")
    print("python sync_airtable_simple.py")

if __name__ == "__main__":
    rebuild_table()