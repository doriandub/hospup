#!/usr/bin/env python3
"""
Script de test pour vérifier la connectivité à la base de données PostgreSQL
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from core.config import settings

def test_database_connection():
    """Test la connexion à la base de données PostgreSQL"""
    
    print("=== TEST DE CONNEXION À LA BASE DE DONNÉES ===")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Database URL: {settings.DATABASE_URL[:50]}...")
    
    try:
        # Créer l'engine de base de données
        engine = create_engine(settings.DATABASE_URL)
        
        # Tester la connexion
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1 as test"))
            row = result.fetchone()
            print(f"✅ Connexion réussie! Test result: {row[0]}")
            
            # Tester les métadonnées des tables
            result = connection.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
            tables = [row[0] for row in result.fetchall()]
            print(f"📋 Tables existantes: {tables}")
            
            # Vérifier si la table users existe
            if 'users' in tables:
                result = connection.execute(text("SELECT COUNT(*) FROM users"))
                user_count = result.fetchone()[0]
                print(f"👥 Nombre d'utilisateurs: {user_count}")
            else:
                print("⚠️  Table 'users' non trouvée - les migrations doivent être appliquées")
                
        return True
        
    except Exception as e:
        print(f"❌ Erreur de connexion: {str(e)}")
        print(f"Type d'erreur: {type(e).__name__}")
        return False

def test_table_creation():
    """Test la création des tables avec SQLAlchemy"""
    
    print("\n=== TEST DE CRÉATION DE TABLES ===")
    
    try:
        from core.database import create_tables, Base, engine
        from models.user import User  # Import explicite du modèle
        
        print("📝 Métadonnées des modèles:")
        for table_name, table in Base.metadata.tables.items():
            print(f"  - {table_name}: {[col.name for col in table.columns]}")
        
        # Créer les tables si elles n'existent pas
        create_tables()
        print("✅ Tables créées avec succès!")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la création des tables: {str(e)}")
        print(f"Type d'erreur: {type(e).__name__}")
        return False

def test_user_registration_simulation():
    """Simule l'enregistrement d'un utilisateur pour identifier l'erreur"""
    
    print("\n=== SIMULATION D'ENREGISTREMENT UTILISATEUR ===")
    
    try:
        from core.database import SessionLocal
        from core.security import get_password_hash
        from models.user import User
        
        # Créer une session de base de données
        db = SessionLocal()
        
        try:
            # Vérifier si l'utilisateur test existe déjà
            existing_user = db.query(User).filter(User.email == "test@example.com").first()
            
            if existing_user:
                print("👤 Utilisateur test existe déjà - suppression pour les tests")
                db.delete(existing_user)
                db.commit()
            
            # Créer un nouvel utilisateur
            print("🔐 Hachage du mot de passe...")
            hashed_password = get_password_hash("testpass123")
            
            print("👤 Création de l'utilisateur...")
            db_user = User(
                name="Test User",
                email="test@example.com",
                password_hash=hashed_password
            )
            
            print("💾 Sauvegarde en base de données...")
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
            print(f"✅ Utilisateur créé avec succès! ID: {db_user.id}")
            print(f"   - Nom: {db_user.name}")
            print(f"   - Email: {db_user.email}")
            print(f"   - Plan: {db_user.plan}")
            print(f"   - Date de création: {db_user.created_at}")
            
            # Nettoyer après le test
            db.delete(db_user)
            db.commit()
            print("🧹 Utilisateur de test supprimé")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Erreur lors de la simulation d'enregistrement: {str(e)}")
        print(f"Type d'erreur: {type(e).__name__}")
        import traceback
        print("📋 Stack trace:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 DIAGNOSTIC DE L'ENDPOINT D'INSCRIPTION HOSPUP")
    print("=" * 60)
    
    # Test 1: Connexion de base
    success1 = test_database_connection()
    
    # Test 2: Création de tables
    success2 = test_table_creation()
    
    # Test 3: Simulation d'enregistrement
    success3 = test_user_registration_simulation()
    
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS:")
    print(f"   Connexion DB: {'✅' if success1 else '❌'}")
    print(f"   Création tables: {'✅' if success2 else '❌'}")
    print(f"   Enregistrement: {'✅' if success3 else '❌'}")
    
    if all([success1, success2, success3]):
        print("\n🎉 TOUS LES TESTS RÉUSSIS - Le problème n'est pas local!")
        print("   Le problème vient probablement de la configuration de production.")
        sys.exit(0)
    else:
        print("\n⚠️  DES PROBLÈMES ONT ÉTÉ DÉTECTÉS")
        sys.exit(1)