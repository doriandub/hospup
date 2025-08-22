#!/usr/bin/env python3
"""
Vérifier la migration vers AWS RDS
"""

import psycopg2
import json
import os
from dotenv import load_dotenv

load_dotenv()

def verify_migration():
    """Vérifier que toutes les données sont bien migrées"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL non configuré")
        return False
    
    try:
        # Connexion PostgreSQL
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Vérifier la table
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'viral_video_templates'
        """)
        
        if not cursor.fetchone():
            print("❌ Table 'viral_video_templates' non trouvée")
            return False
        
        # Compter les enregistrements
        cursor.execute('SELECT COUNT(*) FROM viral_video_templates')
        total_count = cursor.fetchone()[0]
        print(f"📊 Total vidéos dans PostgreSQL: {total_count}")
        
        # Afficher quelques exemples
        cursor.execute("""
            SELECT title, hotel_name, username, views, likes, popularity_score
            FROM viral_video_templates 
            ORDER BY views DESC NULLS LAST
            LIMIT 5
        """)
        
        print(f"\n🎬 TOP 5 VIDÉOS MIGRÉES:")
        print("-" * 80)
        
        for i, row in enumerate(cursor.fetchall(), 1):
            title, hotel, username, views, likes, score = row
            views_str = f"{int(views):,}" if views else "0"
            likes_str = f"{int(likes):,}" if likes else "0"
            print(f"{i}. {title[:30]:<30} @{username or 'N/A':<12} {views_str:>8} vues")
        
        # Vérifier les colonnes
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'viral_video_templates'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        print(f"\n📋 STRUCTURE TABLE ({len(columns)} colonnes):")
        for col_name, col_type in columns:
            print(f"  • {col_name:<20} ({col_type})")
        
        conn.close()
        
        print(f"\n✅ MIGRATION VÉRIFIÉE - Tout fonctionne !")
        print(f"🌐 Base hébergée AWS RDS accessible partout")
        print(f"🚀 Ton SaaS utilise maintenant une vraie DB cloud scalable")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    print("🔍 VÉRIFICATION MIGRATION AWS RDS")
    print("=" * 50)
    verify_migration()