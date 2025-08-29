# Production Deployment Guide

This guide covers deploying Hospup SaaS with **Vercel for frontend** and **Railway for backend**.

## Architecture Overview

- **Frontend**: Next.js app deployed on Vercel
- **Backend**: FastAPI app with Celery workers on Railway
- **Database**: PostgreSQL (Railway provides managed PostgreSQL)
- **Storage**: AWS S3 for file uploads
- **Redis**: Railway provides managed Redis for Celery

## 🚀 Quick Deployment

### Prerequisites

1. Install CLI tools:
```bash
npm install -g vercel
curl -fsSL https://railway.app/install.sh | sh
```

2. Accounts needed:
   - Vercel account (connect GitHub)
   - Railway account (connect GitHub)
   - AWS account (for S3)

### Deploy Backend to Railway

1. **Deploy using script:**
```bash
./deploy-railway.sh
```

2. **Or manually:**
```bash
railway login
railway link  # Link to your Railway project
railway up    # Deploy
```

3. **Set environment variables in Railway dashboard:**
   - Copy variables from `apps/backend/.railway-env`
   - Set in Railway dashboard → Variables tab

### Deploy Frontend to Vercel

1. **Deploy using script:**
```bash
./deploy-vercel.sh
```

2. **Or manually:**
```bash
vercel login
vercel --prod
```

3. **Update backend URL:**
   - Edit `apps/frontend/.env.production`
   - Replace `your-railway-backend.railway.app` with actual Railway URL

## 🔧 Configuration Files

### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "buildCommand": "cd apps/frontend && npm run build",
  "outputDirectory": "apps/frontend/.next",
  "framework": "nextjs",
  "installCommand": "npm install --frozen-lockfile",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-railway-backend.railway.app",
    "NEXT_PUBLIC_WS_URL": "wss://your-railway-backend.railway.app",
    "NEXT_PUBLIC_ENVIRONMENT": "production"
  }
}
```

### Railway Configuration (`railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/backend && pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "./start-railway.sh",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "variables": {
    "PYTHONPATH": "apps/backend",
    "PORT": "8000"
  }
}
```

## 📋 Environment Variables

### Backend (Railway)
Set these in Railway dashboard:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Redis (Railway auto-provides)
REDIS_URL=redis://default:password@host:port

# JWT
SECRET_KEY=your-super-secret-jwt-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET_NAME=hospup-files

# OpenAI
OPENAI_API_KEY=your-openai-key

# Environment
ENVIRONMENT=production
DEBUG=False

# CORS Origins (Frontend URL)
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (Vercel)
Set these in Vercel dashboard or `.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-railway-backend.railway.app
NEXT_PUBLIC_ENVIRONMENT=production
```

## 🗄️ Database Setup

### Railway PostgreSQL

1. **Add PostgreSQL plugin** in Railway dashboard
2. **Copy DATABASE_URL** from Railway
3. **Run migrations:**
```bash
# SSH into Railway container or run locally
cd apps/backend
alembic upgrade head
```

## 🔄 CI/CD Setup

### Automatic Deployments

1. **Vercel**: Connect GitHub repo → auto-deploys on push to main
2. **Railway**: Connect GitHub repo → auto-deploys on push to main

### Manual Deployments

```bash
# Deploy both services
./deploy-railway.sh && ./deploy-vercel.sh
```

## 🐛 Troubleshooting

### Common Issues

1. **Build fails on Railway:**
   - Check nixpacks.toml configuration
   - Verify all dependencies in requirements.txt
   - Check logs: `railway logs`

2. **Frontend can't connect to backend:**
   - Verify CORS_ORIGINS includes Vercel domain
   - Check NEXT_PUBLIC_API_URL is correct
   - Test API endpoint directly

3. **Celery not starting:**
   - Check Redis connection
   - Verify start-railway.sh permissions
   - Check Railway logs for Celery errors

### Monitoring

- **Railway**: Use built-in metrics and logs
- **Vercel**: Use Vercel Analytics and function logs
- **Health checks**: `/health` endpoint for backend

## 🔐 Security Checklist

- [ ] All secrets stored in platform environment variables
- [ ] CORS properly configured
- [ ] Database uses secure connection strings
- [ ] JWT secret is randomly generated and secure
- [ ] S3 bucket has proper IAM permissions
- [ ] HTTPS enforced on both platforms

## 📊 Cost Optimization

### Vercel
- Use Pro plan for better performance
- Monitor function execution time
- Optimize Next.js build size

### Railway
- Start with Hobby plan
- Monitor resource usage
- Scale based on traffic patterns

## 🚀 Performance Tips

1. **Frontend optimization:**
   - Enable Vercel Edge Functions
   - Use Next.js Image optimization
   - Implement proper caching headers

2. **Backend optimization:**
   - Use Railway's auto-scaling
   - Optimize database queries
   - Implement proper Redis caching

## 📝 Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Health checks passing on both services
- [ ] CORS origins include production domains
- [ ] SSL certificates active
- [ ] File uploads working (S3 configured)
- [ ] WebSocket connections functional
- [ ] Celery tasks processing correctly
- [ ] Error monitoring configured
- [ ] Backup strategy implemented

## 🔄 Updates and Rollbacks

### Updates
- Push to main branch → auto-deploys
- Monitor deployment logs
- Test critical paths after deployment

### Rollbacks
```bash
# Vercel rollback
vercel rollback [deployment-url]

# Railway rollback
railway rollback [deployment-id]
```

## 📞 Support

- Vercel: https://vercel.com/support
- Railway: https://railway.app/help
- Project issues: Create GitHub issue