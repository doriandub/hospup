# 🐘 POSTGRESQL + DBEAVER - TA VRAIE BASE DE DONNÉES

**PostgreSQL** est maintenant configuré avec **DBeaver** comme interface graphique !

## ✅ **STATUT ACTUEL**
- ✅ PostgreSQL 15 installé et démarré
- ✅ Base de données `hospup_saas` créée
- ✅ Table `viral_video_templates` créée
- ✅ **10 vidéos migrées** depuis SQLite
- ✅ DBeaver installé (interface graphique)

## 🚀 **COMMENT ACCÉDER À TA BASE**

### **1. Ouvrir DBeaver**
```bash
# DBeaver devrait être ouvert, sinon:
open -a "DBeaver"
```

### **2. Créer la connexion PostgreSQL**
1. **Dans DBeaver**: Clique sur "Nouvelle Connexion" (icône +)
2. **Sélectionne**: PostgreSQL
3. **Configure**:
   ```
   Host: localhost
   Port: 5432
   Database: hospup_saas
   Username: doriandubord
   Password: (laisse vide)
   ```
4. **Test Connection** → **OK**
5. **Finish**

### **3. Accéder à tes données**
1. **Expand**: PostgreSQL → hospup_saas → Schemas → public → Tables
2. **Double-clique**: `viral_video_templates`
3. **Onglet "Data"** → Tu vois tes 10 vidéos ! 🎉

## 📊 **COPIER-COLLER DEPUIS AIRTABLE**

### **Méthode 1: Insertion directe**
1. **Dans DBeaver**: Clique droit sur la table → "Import Data"
2. **Choisir**: CSV file (tu exports depuis Airtable)
3. **Mapper les colonnes**
4. **Import** !

### **Méthode 2: Ajout manuel (style Excel)**
1. **Dans DBeaver**: Onglet "Data" de ta table
2. **Barre d'outils**: Clique "Add" (+) pour nouvelle ligne
3. **Double-clique** sur chaque cellule pour éditer
4. **Ctrl+S** pour sauvegarder

### **Méthode 3: Copier-coller direct**
1. **Dans Airtable**: Sélectionne et copie tes lignes (Cmd+C)
2. **Dans DBeaver**: Sélectionne une cellule vide
3. **Ctrl+V** pour coller
4. **Ctrl+S** pour sauvegarder

## 🎯 **WORKFLOW RECOMMANDÉ**

### **Pour tes vidéos virales:**

1. **Ouvre DBeaver** (Applications)
2. **Connecte-toi** à PostgreSQL (localhost:5432/hospup_saas)
3. **Navigue**: Tables → viral_video_templates → Data
4. **Tu vois tes données** comme dans Excel ! 📊
5. **Édite directement** en double-cliquant
6. **Ajoute des lignes** avec le bouton +
7. **Sauvegarde** avec Ctrl+S

## 🔧 **FONCTIONNALITÉS DBEAVER**

### **Interface style Excel:**
- ✅ **Grid View**: Données en tableau
- ✅ **Édition inline**: Double-clic sur cellule
- ✅ **Tri**: Clic sur en-têtes de colonnes
- ✅ **Filtres**: Barre de filtres
- ✅ **Recherche**: Ctrl+F
- ✅ **Export/Import**: CSV, Excel, JSON

### **Actions possibles:**
- ✅ **Ajouter ligne**: Bouton "Add" (+)
- ✅ **Supprimer ligne**: Sélectionner + Delete
- ✅ **Éditer cellule**: Double-clic
- ✅ **Copier-coller**: Depuis/vers Excel/Airtable
- ✅ **Export CSV**: Pour Excel
- ✅ **Requêtes SQL**: Si besoin avancé

## 📋 **STRUCTURE DE TA TABLE**

```sql
viral_video_templates:
├── id (VARCHAR) - ID unique auto-généré
├── title (VARCHAR) - Titre de la vidéo
├── hotel_name (TEXT) - Nom de l'hôtel
├── username (TEXT) - Username créateur
├── country (TEXT) - Pays
├── video_link (TEXT) - Lien vidéo
├── account_link (TEXT) - Lien compte
├── followers (BIGINT) - Nombre followers
├── views (BIGINT) - Nombre vues
├── likes (BIGINT) - Nombre likes
├── comments (BIGINT) - Nombre commentaires
├── duration (REAL) - Durée en secondes
├── script (JSONB) - Script JSON
├── category (VARCHAR) - Catégorie
├── description (TEXT) - Description
├── popularity_score (REAL) - Score viral (1-10)
├── tags (JSONB) - Tags array
├── segments_pattern (JSONB) - Pattern segments
├── is_active (BOOLEAN) - Actif/Inactif
├── total_duration_min (REAL) - Durée min
├── total_duration_max (REAL) - Durée max
├── created_at (TIMESTAMP) - Date création
└── updated_at (TIMESTAMP) - Date modification
```

## 💡 **TIPS PRATIQUES**

### **Raccourcis DBeaver:**
- `Ctrl+N`: Nouvelle ligne
- `Ctrl+S`: Sauvegarder
- `Delete`: Supprimer ligne sélectionnée
- `Ctrl+F`: Rechercher
- `F5`: Actualiser
- `Ctrl+C/V`: Copier/Coller

### **Import depuis Airtable:**
1. **Airtable**: Export → CSV
2. **DBeaver**: Right-click table → Import Data → CSV
3. **Map columns** selon tes besoins
4. **Import**!

## 🔄 **SYNCHRONISATION AVEC L'APP**

Ton app utilise maintenant PostgreSQL au lieu de SQLite:
- ✅ **DATABASE_URL** mis à jour
- ✅ **Backend** redémarre automatiquement
- ✅ **Frontend** lit depuis PostgreSQL
- ✅ **Données en temps réel**

## 🚨 **IMPORTANT**

- ⚠️ **PostgreSQL doit tourner**: `brew services start postgresql@15`
- ⚠️ **Toujours sauvegarder**: Ctrl+S dans DBeaver
- ⚠️ **Backup régulier**: Export CSV de tes données

---

**🎉 Tu as maintenant PostgreSQL + DBeaver = une vraie base de données professionnelle avec interface Excel-like pour copier-coller depuis Airtable !**

**📍 Pour accéder: Ouvre DBeaver → Connecte localhost:5432/hospup_saas → Table viral_video_templates**