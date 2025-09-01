#!/usr/bin/env python3
"""
Force PostgreSQL configuration for Render
"""
import os
from core.config import settings

def main():
    print(f"Current DATABASE_URL: {settings.DATABASE_URL}")
    print(f"Environment: {settings.ENVIRONMENT}")
    
    # Force PostgreSQL if in production
    if settings.ENVIRONMENT == "production" and "sqlite" in settings.DATABASE_URL:
        print("❌ ERREUR: SQLite détectée en production!")
        print("📋 ACTIONS REQUISES:")
        print("1. Sur Render Dashboard → Environment Variables")
        print("2. Ajouter: DATABASE_URL=postgresql://...")
        print("3. Redéployer le service")
        
        # Try to detect Render's internal PostgreSQL
        render_db = os.getenv("DATABASE_URL")
        if render_db and "postgresql" in render_db:
            print(f"✅ PostgreSQL trouvée: {render_db[:50]}...")
        else:
            print("❌ Aucune variable DATABASE_URL PostgreSQL trouvée")
            
    else:
        print("✅ Configuration correcte")

if __name__ == "__main__":
    main()