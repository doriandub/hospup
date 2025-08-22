# 🌐 BASE DE DONNÉES HÉBERGÉE EN LIGNE PRIVÉE

Tu veux une base de données hébergée en ligne mais privée pour tes vidéos virales. Voici les meilleures options :

## 🏆 **OPTION 1: PostgreSQL sur Railway (RECOMMANDÉ)**

**Pourquoi Railway ?**
- ✅ Gratuit jusqu'à 5GB + 500h/mois
- ✅ PostgreSQL moderne et robuste
- ✅ Interface web intégrée pour gérer la DB
- ✅ Backups automatiques
- ✅ Connexion sécurisée SSL
- ✅ Très simple à configurer

### **Étapes d'installation Railway:**

1. **Créer un compte Railway:**
   ```
   👉 Aller sur: https://railway.app
   👉 Se connecter avec GitHub
   ```

2. **Créer un nouveau projet:**
   ```
   👉 Cliquer "New Project"
   👉 Choisir "Provision PostgreSQL"
   👉 Railway va créer automatiquement ta DB
   ```

3. **Récupérer les informations de connexion:**
   ```
   👉 Dans Railway: Projet → PostgreSQL → Variables
   👉 Noter:
      - DATABASE_URL (connexion complète)
      - PGHOST (hostname)
      - PGPORT (port, généralement 5432)
      - PGDATABASE (nom de la DB)
      - PGUSER (utilisateur)
      - PGPASSWORD (mot de passe)
   ```

## 🔧 **MIGRATION DE SQLite VERS PostgreSQL**

### **1. Installer les dépendances PostgreSQL:**
```bash
cd /Users/doriandubord/Desktop/hospup-saas/apps/backend
source venv/bin/activate
pip install psycopg2-binary
```

### **2. Créer le fichier de configuration:**
```bash
# Créer .env avec tes informations Railway
DATABASE_URL=postgresql://username:password@hostname:port/database
```

### **3. Script de migration automatique:**
```python
# migration_to_postgresql.py
import sqlite3
import psycopg2
import json
import os
from dotenv import load_dotenv

load_dotenv()

def migrate_sqlite_to_postgresql():
    # Connexion SQLite (source)
    sqlite_conn = sqlite3.connect('hospup_saas.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connexion PostgreSQL (destination)
    pg_conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    pg_cursor = pg_conn.cursor()
    
    # 1. Créer la table PostgreSQL
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
    
    # 2. Copier les données
    sqlite_cursor.execute('SELECT * FROM viral_video_templates')
    rows = sqlite_cursor.fetchall()
    
    # 3. Insérer dans PostgreSQL
    for row in rows:
        pg_cursor.execute('''
            INSERT INTO viral_video_templates 
            (id, title, hotel_name, username, country, video_link, account_link,
             followers, views, likes, comments, duration, script, category, 
             description, popularity_score, tags, segments_pattern, is_active,
             total_duration_min, total_duration_max)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING
        ''', row)
    
    pg_conn.commit()
    print(f"✅ {len(rows)} vidéos migrées vers PostgreSQL")
    
    sqlite_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    migrate_sqlite_to_postgresql()
```

## 🔧 **CONFIGURATION DE L'APPLICATION**

### **1. Mettre à jour database.py:**
```python
# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Support SQLite ET PostgreSQL
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./hospup_saas.db')

if DATABASE_URL.startswith('postgresql'):
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

## 🌐 **ACCÈS À LA BASE DE DONNÉES EN LIGNE**

### **1. Interface Web Railway:**
```
👉 Railway Dashboard → Ton Projet → PostgreSQL → Data
👉 Interface web pour voir/éditer tes données
👉 Requêtes SQL directes possibles
```

### **2. Clients Desktop (comme DB Browser):**
```bash
# Installer pgAdmin (interface graphique PostgreSQL)
brew install --cask pgadmin4

# Ou DBeaver (multi-DB, gratuit)
brew install --cask dbeaver-community
```

### **3. Script d'accès direct PostgreSQL:**
```python
# postgresql_access.py
import psycopg2
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

def connect_postgresql():
    return psycopg2.connect(os.getenv('DATABASE_URL'))

def show_all_videos():
    conn = connect_postgresql()
    df = pd.read_sql('''
        SELECT title, username, country, views, likes, popularity_score
        FROM viral_video_templates 
        ORDER BY views DESC
    ''', conn)
    print(df)
    conn.close()

def export_to_csv():
    conn = connect_postgresql()
    df = pd.read_sql('SELECT * FROM viral_video_templates', conn)
    df.to_csv('viral_videos_postgresql_export.csv', index=False)
    print("📁 Export terminé: viral_videos_postgresql_export.csv")
    conn.close()

if __name__ == "__main__":
    show_all_videos()
```

## 💡 **AUTRES OPTIONS HÉBERGÉES**

### **Option 2: Supabase (PostgreSQL + Interface)**
- Base PostgreSQL gratuite
- Interface web incluse
- API automatique
- Site: https://supabase.com

### **Option 3: PlanetScale (MySQL)**
- MySQL sans serveur
- Interface web moderne
- Branching comme Git
- Site: https://planetscale.com

### **Option 4: Neon (PostgreSQL)**
- PostgreSQL moderne
- Scaling automatique
- Gratuit généreux
- Site: https://neon.tech

## 🚀 **PROCHAINES ÉTAPES**

1. **Choisir Railway** (recommandé)
2. **Créer compte + DB PostgreSQL**
3. **Récupérer DATABASE_URL**
4. **Lancer migration:** `python migration_to_postgresql.py`
5. **Tester connexion:** `python postgresql_access.py`
6. **Mettre à jour l'app** avec nouvelles variables d'environnement

---

**🎯 Résultat: Ta base sera accessible depuis n'importe où, sécurisée, et avec interface web pour gérer tes vidéos virales !**