# 🗄️ VRAIE BASE DE DONNÉES - GUIDE COMPLET

**DB Browser for SQLite** est maintenant installé ! C'est un **vrai outil de base de données** comme Excel mais pour les bases de données.

## 📍 **TA BASE DE DONNÉES**
```
📁 Localisation: /Users/doriandubord/Desktop/hospup-saas/apps/backend/hospup_saas.db
📊 Type: SQLite
🏷️ Table: viral_video_templates
```

## 🚀 **COMMENT OUVRIR TA BASE**

### **Option 1: Double-clic (le plus simple)**
```bash
# Va dans le dossier backend et double-clique sur hospup_saas.db
cd /Users/doriandubord/Desktop/hospup-saas/apps/backend
open hospup_saas.db
```

### **Option 2: Depuis DB Browser**
1. **Ouvre "DB Browser for SQLite"** (dans Applications)
2. **File → Open Database**
3. **Sélectionne:** `/Users/doriandubord/Desktop/hospup-saas/apps/backend/hospup_saas.db`
4. **Clique sur "Browse Data"**
5. **Sélectionne la table:** `viral_video_templates`

## 📊 **COPIER-COLLER DEPUIS AIRTABLE**

### **Étapes détaillées:**

1. **Dans Airtable:**
   - Sélectionne tes lignes
   - `Cmd+C` (copier)

2. **Dans DB Browser:**
   - Clique sur l'onglet **"Browse Data"**
   - Sélectionne la table **"viral_video_templates"**
   - Clique sur **"New Record"** (bouton +)
   - **Double-clique sur chaque cellule** pour coller tes données
   - Ou utilise **"Insert" → "Paste from Clipboard"**

3. **Sauvegarder:**
   - `Cmd+S` ou clique **"Write Changes"**

## 🔧 **FONCTIONNALITÉS DE DB BROWSER**

### **Interface principale:**
- ✅ **Browse Data**: Voir/éditer tes données (comme Excel)
- ✅ **Execute SQL**: Requêtes SQL avancées
- ✅ **Edit Pragmas**: Paramètres de la base
- ✅ **DB Schema**: Structure des tables

### **Actions possibles:**
- ✅ **Ajouter des lignes**: Bouton "New Record" (+)
- ✅ **Éditer des cellules**: Double-clic
- ✅ **Supprimer des lignes**: Sélectionner + Delete
- ✅ **Trier**: Clic sur les en-têtes de colonnes
- ✅ **Filtrer**: Menu "Filters"
- ✅ **Export**: File → Export → Table as CSV
- ✅ **Import**: File → Import → Table from CSV

## 📋 **STRUCTURE DE TA TABLE**

```sql
viral_video_templates:
├── id (VARCHAR) - ID unique
├── title (VARCHAR) - Titre de la vidéo
├── hotel_name (TEXT) - Nom de l'hôtel
├── username (TEXT) - Username créateur
├── country (TEXT) - Pays
├── video_link (TEXT) - Lien vidéo
├── account_link (TEXT) - Lien compte
├── followers (REAL) - Nombre followers
├── views (REAL) - Nombre vues
├── likes (REAL) - Nombre likes
├── comments (REAL) - Nombre commentaires
├── duration (REAL) - Durée en secondes
├── script (TEXT) - Script JSON
├── category (VARCHAR) - Catégorie
├── description (TEXT) - Description
├── popularity_score (FLOAT) - Score viral (1-10)
└── tags (JSON) - Tags
```

## 🎯 **WORKFLOW RECOMMANDÉ**

### **Pour tes données Airtable:**

1. **Ouvre DB Browser**: `Applications → DB Browser for SQLite`
2. **Ouvre ta base**: `hospup_saas.db`
3. **Va sur "Browse Data"** → table `viral_video_templates`
4. **Dans Airtable**: Copie tes lignes (`Cmd+C`)
5. **Dans DB Browser**: 
   - Clique "New Record" pour chaque ligne
   - Double-clique sur chaque cellule pour coller
   - Ou utilise "Import" pour un CSV d'Airtable
6. **Sauvegarde**: `Cmd+S` ou "Write Changes"

## 🔄 **IMPORT CSV DEPUIS AIRTABLE**

### **Méthode recommandée:**

1. **Dans Airtable:**
   - Sélectionne tes données
   - Export → CSV

2. **Dans DB Browser:**
   - File → Import → Table from CSV file
   - Sélectionne ton fichier CSV d'Airtable
   - Configure les colonnes
   - Import!

## 💡 **TIPS PRATIQUES**

### **Raccourcis utiles:**
- `Cmd+N`: Nouveau record
- `Cmd+S`: Sauvegarder
- `Delete`: Supprimer record sélectionné
- `Cmd+F`: Rechercher
- `F5`: Actualiser

### **Pour les débutants:**
- **Browse Data** = ton Excel
- **Double-clic** = éditer une cellule
- **New Record** = nouvelle ligne
- **Write Changes** = sauvegarder

## 🚨 **IMPORTANT**

- ⚠️ **TOUJOURS** clique "Write Changes" pour sauvegarder
- ⚠️ **Backup** ta base avant gros changements: `Cmd+C` sur le fichier
- ⚠️ **Ferme l'app** backend avant édition pour éviter conflits

---

**🎉 Tu as maintenant une VRAIE base de données avec interface graphique pour copier-coller tes données Airtable !**