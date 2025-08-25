# Guide de déploiement Hospup

## 🎯 Architecture adaptative

Le projet s'adapte automatiquement à l'environnement de déploiement :

- **Local** : Traitement asynchrone avec Celery + Redis
- **Vercel** : Traitement synchrone optimisé (30s max)
- **Production** : Choix automatique selon disponibilité Redis

## 🚀 Déploiement Vercel

### 1. Prérequis

```bash
# Variables d'environnement Vercel
POSTGRES_URL=postgresql://...
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your_bucket
STORAGE_BACKEND=s3
OPENAI_API_KEY=your_openai_key

# Optionnel pour production avancée
REDIS_URL=redis://...  # Active le traitement async si disponible
```

### 2. Configuration

Le fichier `vercel.json` est déjà configuré pour :
- Frontend Next.js sur le domaine principal
- Backend FastAPI sur `/api/*`
- Timeout de 30s pour les fonctions
- Traitement vidéo synchrone optimisé

### 3. Déploiement

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod

# Ou connecter via Git (recommandé)
# Push sur main → déploiement automatique
```

## 🔧 Traitement vidéo adaptatif

### Vercel (Synchrone - 30s max)
- Conversion vidéo : 20s max
- Analyse IA : 15s max (3 frames)
- Génération thumbnail : 10s max
- **Avantage** : Traitement immédiat, pas de dépendances

### Local/Production avec Redis (Asynchrone)
- Conversion vidéo : 60s max
- Analyse IA : 45s max (8 frames)
- Génération thumbnail : 30s max
- **Avantage** : Traitement plus approfondi, non-bloquant

## 📊 Monitoring & Logs

### Vercel
```bash
# Voir les logs en temps réel
vercel logs --follow

# Logs d'une fonction spécifique
vercel logs --function=api
```

### Local
```bash
# Backend
tail -f logs/backend.log

# Celery (si utilisé)
tail -f logs/celery.log
```

## 🔄 Système de fallback

1. **Détection automatique** de l'environnement
2. **Choix automatique** du mode de traitement
3. **Fallback gracieux** en cas d'erreur
4. **Logs détaillés** pour debug

## 📝 Variables d'environnement

### Obligatoires
- `POSTGRES_URL` : Base de données
- `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` : S3
- `S3_BUCKET_NAME` : Bucket S3

### Optionnelles
- `REDIS_URL` : Active le traitement async
- `OPENAI_API_KEY` : Améliore l'analyse IA
- `GROQ_API_KEY` : Alternative à OpenAI

### Automatiques (Vercel)
- `VERCEL=1` : Détection environnement
- `PORT` : Port du serveur

## 🚨 Limitations Vercel

- **Timeout** : 30s max pour Hobby, 60s pour Pro
- **Mémoire** : 1GB max pour les fonctions
- **Stockage** : Temporaire uniquement (`/tmp`)
- **Processus** : Pas de workers persistants (pas de Celery)

## ✅ Tests de déploiement

```bash
# Test local avec mode Vercel
VERCEL=1 python main.py

# Test upload
curl -X POST "http://localhost:8000/api/v1/upload/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"s3_key": "test.mp4", ...}'
```

## 🔧 Dépannage

### Timeout Vercel
- Réduire `max_frames_for_ai` dans la config
- Désactiver certaines étapes si nécessaire
- Passer à Vercel Pro (60s timeout)

### Erreurs S3
- Vérifier les credentials AWS
- Vérifier les permissions du bucket
- Tester la connexion S3

### Base de données
- Utiliser connection pooling
- Fermer les connexions correctement
- Optimiser les requêtes pour Postgres

## 📈 Optimisations production

1. **CDN** : Vercel CDN automatique pour le frontend
2. **Caching** : Redis pour les métadonnées vidéo
3. **Compression** : Activée automatiquement
4. **Edge functions** : Pour les requêtes rapides
5. **Monitoring** : Logs et métriques intégrés