# 🚀 Hospup Deployment Guide

## Quick Setup (10 minutes total)

### 1. Database Setup (3 minutes)
1. Go to [neon.tech](https://neon.tech)
2. Create account → New Project
3. Copy the **Connection String**
4. Save it: `postgresql://user:pass@host/db`

### 2. Railway Backend Setup (5 minutes)
1. Go to [railway.app](https://railway.app)
2. **"Deploy from GitHub repo"**
3. Select this repository
4. Railway auto-detects Python and builds

**Add these Environment Variables in Railway:**
```env
DATABASE_URL=postgresql://your-neon-connection-string
SECRET_KEY=your-super-secret-jwt-key-here-make-it-long
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET_NAME=hospup-files
OPENAI_API_KEY=your-openai-key
ENVIRONMENT=production
DEBUG=False
CORS_ORIGINS=https://your-frontend.vercel.app
```

**Railway will automatically provide:**
- `REDIS_URL` (Redis service)
- `PORT` (Auto-assigned)

### 3. Add Redis Service in Railway
1. In your Railway project
2. **"+ New Service"** → **"Add Redis"**
3. Railway connects automatically

### 4. Vercel Frontend Setup (2 minutes)
1. Go to [vercel.com](https://vercel.com)
2. **"Import Git Repository"**
3. Select this repo → **"apps/frontend"** folder
4. Add Environment Variable:
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## 🎯 Result
- **Backend**: `https://your-app.railway.app`
- **Frontend**: `https://your-app.vercel.app`
- **Database**: Neon PostgreSQL
- **Redis**: Railway Redis
- **Files**: AWS S3

## 🔧 Automatic Features
- ✅ SSL certificates
- ✅ Auto-deploy on git push
- ✅ Health checks
- ✅ Celery workers for video processing
- ✅ Automatic recovery system
- ✅ Zero-downtime deployment

## 💰 Monthly Cost
- Railway: €0-5 (depends on usage)
- Vercel: €0 (hobby plan)
- Neon: €0 (3GB free)
- AWS S3: €1-3 (storage)
**Total: ~€5/month**

## 🚨 Important Notes
1. **Custom Domain**: Add your domain in Vercel settings
2. **CORS**: Update CORS_ORIGINS with your real domain
3. **SSL**: Automatic via Railway & Vercel
4. **Monitoring**: Railway provides logs & metrics

## 🔍 Troubleshooting
- **Build Failed**: Check logs in Railway dashboard
- **Database Connection**: Verify DATABASE_URL format
- **CORS Issues**: Check CORS_ORIGINS matches frontend URL
- **Celery Issues**: Check Redis connection in Railway logs

Ready to deploy? 🚀