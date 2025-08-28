# Plan de Scalabilité Upload Hospup SaaS

## Architecture Recommandée (Production)

### Phase 1: Fix CORS + Presigned URLs
- ✅ Upload direct browser → S3 (pas de backend bloqué)
- ✅ Backend génère presigned URL + webhook completion
- ✅ Scalabilité: milliers d'uploads simultanés

### Phase 2: Processing Pipeline
```
Upload → S3 → Webhook/SQS → Celery Workers → Processing
                    ↓
              Multiple workers en parallèle
```

### Phase 3: CDN + Multi-region
- CloudFront pour les uploads
- Multi-region S3 buckets
- Celery workers distribués

## Comparaison Performance

| Système | Users Simultanés | Upload Time | Backend Load |
|---------|------------------|-------------|--------------|
| Direct  | ~20             | Normal      | 🔴 Très élevé |
| Presigned| ~10,000         | Plus rapide | 🟢 Minimal   |

## Actions Immédiates

1. **Garder système direct pour DEV** (simplicité)
2. **Configurer CORS S3 pour PROD** (performance) 
3. **Variable d'environnement** pour choisir le mode

```python
# config.py
UPLOAD_MODE = "direct"  # dev
UPLOAD_MODE = "presigned"  # production
```

## Estimation Coûts

- Direct: 1 serveur backend gère ~20 users
- Presigned: 1 serveur backend gère ~10,000 users
- **Économie**: 500x moins de serveurs backend nécessaires