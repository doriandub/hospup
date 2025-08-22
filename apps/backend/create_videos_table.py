#!/usr/bin/env python3
"""
Créer la table videos qui manque
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def create_videos_table():
    """Créer la table videos"""
    
    DATABASE_URL = os.getenv('DATABASE_URL')
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("🎬 CRÉATION TABLE VIDEOS")
    print("=" * 30)
    
    # Créer la table videos
    print("🏗️ Création table videos...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS videos (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR NOT NULL,
            description TEXT,
            
            -- File info
            video_url VARCHAR NOT NULL,
            thumbnail_url VARCHAR,
            format VARCHAR DEFAULT 'mp4' NOT NULL,
            duration REAL,
            size INTEGER,
            
            -- Status and processing
            status VARCHAR DEFAULT 'processing' NOT NULL,
            language VARCHAR DEFAULT 'en' NOT NULL,
            
            -- Generation metadata
            source_type VARCHAR,
            source_data TEXT,
            viral_video_id VARCHAR,
            generation_job_id VARCHAR,
            
            -- Relationships
            user_id VARCHAR NOT NULL REFERENCES users(id),
            property_id VARCHAR NOT NULL REFERENCES properties(id),
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            completed_at TIMESTAMP
        )
    ''')
    
    print("✅ Table videos créée !")
    
    # Vérifier la structure
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'videos'
        ORDER BY ordinal_position
    """)
    
    columns = cursor.fetchall()
    print(f"\n📋 STRUCTURE TABLE VIDEOS ({len(columns)} colonnes):")
    
    for col_name, col_type in columns:
        print(f"  • {col_name:<20} ({col_type})")
    
    conn.commit()
    conn.close()
    
    print(f"\n🎉 TABLE VIDEOS CRÉÉE AVEC SUCCÈS!")

if __name__ == "__main__":
    create_videos_table()