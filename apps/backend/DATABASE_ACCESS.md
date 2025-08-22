# 🗄️ ACCÈS DIRECT À LA BASE DE DONNÉES

Tu as maintenant un **accès direct et complet** à ta vraie base de données SQLite.

## 📍 **Localisation de la Base de Données**
```
/Users/doriandubord/Desktop/hospup-saas/apps/backend/hospup_saas.db
```

## 🚀 **3 Façons d'Accéder à la Database**

### **1. Script Python Interactif (RECOMMANDÉ)**
```bash
cd /Users/doriandubord/Desktop/hospup-saas/apps/backend
source venv/bin/activate
python database_access.py
```

**Fonctionnalités:**
- ✅ Voir toutes les vidéos virales
- ✅ Rechercher par titre/username/pays
- ✅ Ajouter des vidéos manuellement
- ✅ **Export CSV** (pour Excel/Google Sheets)
- ✅ **Import CSV** (depuis Excel/Google Sheets)
- ✅ Accès SQLite direct

### **2. SQLite Command Line (Terminal)**
```bash
cd /Users/doriandubord/Desktop/hospup-saas/apps/backend
sqlite3 hospup_saas.db
```

**Commandes utiles:**
```sql
-- Voir toutes les tables
.tables

-- Structure de la table viral videos
.schema viral_video_templates

-- Voir toutes les vidéos
SELECT title, username, views, likes FROM viral_video_templates ORDER BY views DESC;

-- Ajouter une vidéo
INSERT INTO viral_video_templates (id, title, username, country, views, likes, script, is_active) 
VALUES ('unique-id', 'Titre Video', 'username', 'France', 1000000, 50000, '{"clips":[],"texts":[]}', 1);

-- Chercher par username
SELECT * FROM viral_video_templates WHERE username LIKE '%viensonpartloin%';

-- Quitter
.quit
```

### **3. DB Browser for SQLite (Interface Graphique)**

**Installation:**
```bash
# Sur Mac avec Homebrew
brew install --cask db-browser-for-sqlite

# Ou télécharger depuis: https://sqlitebrowser.org/
```

**Utilisation:**
1. Ouvre DB Browser for SQLite
2. File → Open Database
3. Sélectionne: `/Users/doriandubord/Desktop/hospup-saas/apps/backend/hospup_saas.db`
4. Onglet "Browse Data" → Table: `viral_video_templates`

## 📊 **Structure de la Table `viral_video_templates`**

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | VARCHAR | ID unique (auto-généré) |
| `title` | VARCHAR(255) | Titre de la vidéo |
| `hotel_name` | TEXT | Nom de l'hôtel/établissement |
| `username` | TEXT | Username du créateur |
| `country` | TEXT | Pays d'origine |
| `video_link` | TEXT | Lien vers la vidéo |
| `account_link` | TEXT | Lien vers le compte |
| `followers` | REAL | Nombre de followers |
| `views` | REAL | Nombre de vues |
| `likes` | REAL | Nombre de likes |
| `comments` | REAL | Nombre de commentaires |
| `duration` | REAL | Durée en secondes |
| `script` | TEXT | Script JSON (clips + textes) |
| `category` | VARCHAR(100) | Catégorie |
| `description` | TEXT | Description |
| `popularity_score` | FLOAT | Score viral (1-10) |
| `tags` | JSON | Tags (array JSON) |

## 💡 **Workflow Recommandé**

### **Pour ajouter tes vidéos virales:**

1. **Utilise le script interactif:**
   ```bash
   python database_access.py
   # Choix 3: Ajouter une vidéo
   ```

2. **Ou import CSV en masse:**
   - Crée un fichier Excel/CSV avec tes données
   - Colonnes: Titre, Username, Pays, Lien_Video, Vues, Likes, etc.
   - Sauvegarde en CSV
   - `python database_access.py` → Choix 5: Import CSV

3. **Ou accès direct SQLite:**
   ```bash
   sqlite3 hospup_saas.db
   ```

### **Pour consulter/analyser:**

1. **Export vers Excel:**
   ```bash
   python database_access.py
   # Choix 4: Export CSV
   ```

2. **Recherche rapide:**
   ```bash
   python database_access.py
   # Choix 2: Rechercher
   ```

## 🎯 **Exemple d'Ajout de ta Vidéo "Viens on part loin"**

```sql
INSERT INTO viral_video_templates (
    id, title, username, country, video_link, account_link,
    followers, views, likes, comments, duration,
    script, category, popularity_score, is_active
) VALUES (
    'viens-on-part-loin-001',
    'Viens on part loin 🌍✈️',
    'viensonpartloin_',
    'France',
    'https://www.instagram.com/p/DNcv2FosD_6/',
    'https://www.instagram.com/viensonpartloin_/',
    235000,
    1170352,
    22206,
    299,
    12.0,
    '{"clips":[{"order":1,"duration":3.80,"description":"Airplane view of clouds..."}],"texts":[{"content":"DEPUIS SON HUBLOT...","start":0.00,"end":3.80}]}',
    'Travel Tips',
    8.5,
    1
);
```

## 🔒 **Backup & Sécurité**

**Backup de la DB:**
```bash
cp hospup_saas.db hospup_saas_backup_$(date +%Y%m%d).db
```

**Export complet:**
```bash
python database_access.py
# Choix 4: Export CSV (pour backup Excel)
```

---

**Tu as maintenant un contrôle TOTAL sur ta base de données! 🚀**