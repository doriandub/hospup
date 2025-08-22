#!/usr/bin/env python3
"""
Setup complet base AWS RDS PostgreSQL
"""

import psycopg2
import bcrypt
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

def setup_database():
    """Créer toutes les tables et l'utilisateur admin"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL non configuré")
        return False
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("🗄️ Connexion AWS RDS PostgreSQL réussie")
        
        # 1. Créer table users
        print("👤 Création table users...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 2. Créer table properties
        print("🏨 Création table properties...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS properties (
                id VARCHAR PRIMARY KEY,
                user_id VARCHAR REFERENCES users(id),
                name VARCHAR(255) NOT NULL,
                address TEXT,
                city VARCHAR(100),
                country VARCHAR(100),
                property_type VARCHAR(50),
                description TEXT,
                website_url VARCHAR(255),
                instagram_handle VARCHAR(100),
                phone VARCHAR(50),
                email VARCHAR(255),
                language VARCHAR(10) DEFAULT 'fr',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 3. Table viral_video_templates existe déjà (créée par migration)
        print("🎬 Vérification table viral_video_templates...")
        cursor.execute("""
            SELECT COUNT(*) FROM viral_video_templates
        """)
        video_count = cursor.fetchone()[0]
        print(f"✅ {video_count} vidéos virales trouvées")
        
        # 4. Créer utilisateur admin s'il n'existe pas
        print("🔑 Vérification utilisateur admin...")
        cursor.execute("SELECT id FROM users WHERE email = 'admin@hospup.com'")
        if not cursor.fetchone():
            print("👨‍💼 Création utilisateur admin...")
            
            # Hash du mot de passe
            password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cursor.execute('''
                INSERT INTO users (id, email, password_hash, first_name, last_name, is_admin)
                VALUES (%s, %s, %s, %s, %s, %s)
            ''', (
                str(uuid.uuid4()),
                'admin@hospup.com',
                password_hash,
                'Admin',
                'Hospup',
                True
            ))
            print("✅ Utilisateur admin créé")
        else:
            print("✅ Utilisateur admin existe déjà")
        
        # 5. Créer propriété exemple
        cursor.execute("SELECT id FROM users WHERE email = 'admin@hospup.com'")
        admin_id = cursor.fetchone()[0]
        
        cursor.execute("SELECT id FROM properties WHERE name = 'Sémaphore de Lervilly'")
        if not cursor.fetchone():
            print("🏨 Création propriété exemple...")
            
            cursor.execute('''
                INSERT INTO properties (id, user_id, name, address, city, country, property_type, description, language)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                str(uuid.uuid4()),
                admin_id,
                'Sémaphore de Lervilly',
                'Route de la Pointe du Semaphore',
                'Lervilly',
                'France',
                'Hotel',
                'Hôtel de luxe avec vue sur mer',
                'fr'
            ))
            print("✅ Propriété exemple créée")
        else:
            print("✅ Propriété exemple existe déjà")
        
        # Sauvegarder
        conn.commit()
        
        # Vérification finale
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM properties") 
        property_count = cursor.fetchone()[0]
        
        print(f"\n🎉 DATABASE SETUP TERMINÉ !")
        print(f"👤 {user_count} utilisateurs")
        print(f"🏨 {property_count} propriétés")
        print(f"🎬 {video_count} vidéos virales")
        print(f"\n🔑 CONNEXION:")
        print(f"Email: admin@hospup.com")
        print(f"Password: admin123")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    print("🚀 SETUP DATABASE AWS RDS")
    print("=" * 40)
    setup_database()