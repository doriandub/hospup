#!/usr/bin/env python3
"""
Corriger le schéma utilisateur PostgreSQL pour correspondre au modèle
"""

import psycopg2
import bcrypt
import os
from dotenv import load_dotenv
import uuid

load_dotenv()

def fix_user_schema():
    """Adapter le schéma PostgreSQL au modèle User existant"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL non configuré")
        return False
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("🔧 Correction schéma table users...")
        
        # 1. Vérifier si first_name et last_name existent
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('first_name', 'last_name', 'name')
        """)
        
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"📋 Colonnes existantes: {existing_columns}")
        
        # 2. Si first_name et last_name existent, créer colonne name
        if 'first_name' in existing_columns and 'last_name' in existing_columns:
            print("🔄 Création colonne 'name' à partir de first_name + last_name...")
            
            # Ajouter colonne name si elle n'existe pas
            if 'name' not in existing_columns:
                cursor.execute("ALTER TABLE users ADD COLUMN name VARCHAR(255)")
                print("✅ Colonne 'name' ajoutée")
            
            # Remplir la colonne name
            cursor.execute("""
                UPDATE users SET name = CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
                WHERE name IS NULL OR name = ''
            """)
            print("✅ Données migrées vers colonne 'name'")
            
        # 3. Ajouter les colonnes manquantes du modèle User
        missing_columns = [
            ("plan", "VARCHAR(50) DEFAULT 'free'"),
            ("videos_used", "INTEGER DEFAULT 0"),
            ("videos_limit", "INTEGER DEFAULT 2"), 
            ("subscription_id", "VARCHAR(255)"),
            ("customer_id", "VARCHAR(255)"),
            ("email_verified", "BOOLEAN DEFAULT FALSE")
        ]
        
        for col_name, col_def in missing_columns:
            if col_name not in existing_columns:
                try:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                    print(f"✅ Colonne '{col_name}' ajoutée")
                except Exception as e:
                    print(f"⚠️ Colonne '{col_name}' existe déjà ou erreur: {e}")
        
        # 4. Mettre à jour l'utilisateur admin existant
        cursor.execute("SELECT id FROM users WHERE email = 'admin@hospup.com'")
        admin_exists = cursor.fetchone()
        
        if admin_exists:
            print("🔄 Mise à jour utilisateur admin existant...")
            # Hash du mot de passe
            password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cursor.execute('''
                UPDATE users SET 
                    name = %s,
                    password_hash = %s,
                    plan = %s,
                    videos_limit = %s,
                    is_admin = %s
                WHERE email = %s
            ''', (
                'Admin Hospup',
                password_hash,
                'enterprise',
                -1,
                True,
                'admin@hospup.com'
            ))
            print("✅ Utilisateur admin mis à jour")
        else:
            print("👨‍💼 Création nouvel utilisateur admin...")
            password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cursor.execute('''
                INSERT INTO users (id, email, name, password_hash, is_admin, plan, videos_limit)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (
                str(uuid.uuid4()),
                'admin@hospup.com',
                'Admin Hospup',
                password_hash,
                True,
                'enterprise',
                -1
            ))
            print("✅ Nouvel utilisateur admin créé")
        
        # 5. Supprimer anciennes colonnes si nécessaire
        # (optionnel - on peut les garder)
        
        conn.commit()
        
        # Vérification finale
        cursor.execute("SELECT id, email, name, plan, videos_limit FROM users WHERE email = 'admin@hospup.com'")
        admin = cursor.fetchone()
        
        print(f"\n🎉 SCHÉMA CORRIGÉ !")
        print(f"👤 Admin: {admin[2]} ({admin[1]})")
        print(f"📊 Plan: {admin[3]}, Limite: {admin[4]}")
        print(f"\n🔑 CONNEXION:")
        print(f"Email: admin@hospup.com")
        print(f"Password: admin123")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    print("🔧 CORRECTION SCHÉMA USER PostgreSQL")
    print("=" * 45)
    fix_user_schema()