# 🚀 Guide de Déploiement Rapide

## ✅ Prérequis (À faire manuellement)

```bash
# 1. Installer les CLI
npm install -g vercel
curl -fsSL https://railway.app/install.sh | sh

# 2. Créer comptes sur:
# - railway.app (connecter GitHub)
# - vercel.com (connecter GitHub)
```

## 🔍 Validation

```bash
# Valider que tout est prêt
./validate-deployment.sh
```

## 📋 Déploiement Étape par Étape

### 1️⃣ Déployer Backend (Railway)

```bash
./deploy-railway.sh
```

**Après le déploiement Railway:**

1. **Copier l'URL Railway** (ex: `https://hospup-backend-abc123.railway.app`)

2. **Configurer variables d'environnement** dans Railway dashboard:
   - Aller sur railway.app → Projet → Variables
   - Copier/coller depuis `apps/backend/.railway-env`
   - ⚠️ Remplacer les valeurs placeholder:
     - `AWS_ACCESS_KEY_ID=AKIA...` → vraie clé AWS
     - `AWS_SECRET_ACCESS_KEY=...` → vrai secret AWS  
     - `OPENAI_API_KEY=sk-...` → vraie clé OpenAI
     - `SECRET_KEY=...` → clé JWT sécurisée

3. **Ajouter services Railway** (si pas auto-créés):
   - PostgreSQL plugin
   - Redis plugin

### 2️⃣ Configurer Frontend

```bash
# Éditer avec l'URL Railway réelle
nano apps/frontend/.env.production

# Remplacer:
NEXT_PUBLIC_API_URL=https://hospup-backend-ABC123.railway.app
NEXT_PUBLIC_WS_URL=wss://hospup-backend-ABC123.railway.app
```

### 3️⃣ Déployer Frontend (Vercel)

```bash
./deploy-vercel.sh
```

### 4️⃣ Finaliser Configuration

1. **Copier URL Vercel** (ex: `https://hospup-xyz.vercel.app`)

2. **Mettre à jour CORS** dans Railway:
   ```
   CORS_ORIGINS=https://hospup-xyz.vercel.app,https://hospup.com
   ```

3. **Tester les déploiements:**
   - Backend: `https://ton-backend.railway.app/health`
   - Frontend: `https://ton-frontend.vercel.app`

## 🔧 Commandes Utiles

```bash
# Re-déployer backend uniquement
./deploy-railway.sh

# Re-déployer frontend uniquement  
./deploy-vercel.sh

# Valider configuration
./validate-deployment.sh

# Logs Railway
railway logs

# Logs Vercel
vercel logs
```

## ⚡ Déploiement Express (si tout configuré)

```bash
# Tout déployer d'un coup
./deploy-railway.sh && sleep 30 && ./deploy-vercel.sh
```

## 🆘 En cas d'erreur

1. **Backend ne démarre pas:**
   - Vérifier logs: `railway logs`
   - Vérifier variables d'environnement
   - S'assurer PostgreSQL/Redis connectés

2. **Frontend erreur de build:**
   - Vérifier `vercel logs`
   - Vérifier syntaxe dans `.env.production`

3. **CORS errors:**
   - Vérifier `CORS_ORIGINS` dans Railway
   - Inclure URL Vercel exacte

## 📞 Support

- Railway: railway.app/help  
- Vercel: vercel.com/support