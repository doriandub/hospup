# Hospup-SaaS Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- pnpm
- Docker & Docker Compose

### 1. Clone and Setup
```bash
git clone <repo>
cd hospup-saas
pnpm install
```

### 2. Start Development Services
```bash
# Start PostgreSQL and Redis
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps
```

### 3. Setup Backend
```bash
cd apps/backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Setup Frontend
```bash
cd apps/frontend

# Install dependencies
pnpm install

# Start Next.js development server
pnpm dev
```

## 📁 Project Structure

```
hospup-saas/
├── apps/
│   ├── frontend/          # Next.js 15 App
│   └── backend/           # FastAPI App
├── packages/
│   ├── shared-types/      # Shared TypeScript types
│   ├── ui-components/     # Reusable UI components
│   └── utils/             # Shared utilities
├── infrastructure/
│   ├── docker/            # Development containers
│   ├── k8s/              # Kubernetes manifests
│   └── terraform/         # Infrastructure as Code
└── docs/                  # Documentation
```

## 🔧 Development Commands

### Root Commands (using Turborepo)
```bash
pnpm dev           # Start all apps in development
pnpm build         # Build all apps
pnpm test          # Run all tests
pnpm lint          # Lint all code
pnpm type-check    # TypeScript type checking
```

### Backend Commands
```bash
cd apps/backend

# Database
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                                # Apply migrations
alembic downgrade -1                               # Rollback last migration

# Development
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Testing
pytest
pytest -v                                          # Verbose
pytest tests/test_auth.py                         # Specific file
```

### Frontend Commands
```bash
cd apps/frontend

# Development
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Lint code
pnpm type-check    # TypeScript checking
```

## 🗄️ Database

### Connection Details
- **Host**: localhost
- **Port**: 5432
- **Database**: hospup_saas
- **User**: postgres
- **Password**: password

### Accessing Database
```bash
# Via Docker
docker exec -it hospup-postgres psql -U postgres -d hospup_saas

# Via psql (if installed locally)
psql -h localhost -U postgres -d hospup_saas
```

## 🔴 Redis

### Connection Details
- **Host**: localhost
- **Port**: 6379

### Accessing Redis
```bash
# Via Docker
docker exec -it hospup-redis redis-cli

# Via Redis Commander (Web UI)
# Open http://localhost:8081
```

## 🧪 Testing

### Backend Testing
```bash
cd apps/backend
pytest                     # Run all tests
pytest -v                  # Verbose output
pytest --cov              # With coverage
pytest tests/test_auth.py  # Specific test file
```

### Frontend Testing
```bash
cd apps/frontend
pnpm test              # Run Jest tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
```

## 🔒 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/hospup_saas
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port
   lsof -ti:3000 | xargs kill -9  # Frontend
   lsof -ti:8000 | xargs kill -9  # Backend
   ```

2. **Database connection issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose -f infrastructure/docker/docker-compose.dev.yml ps
   
   # Restart PostgreSQL
   docker-compose -f infrastructure/docker/docker-compose.dev.yml restart postgres
   ```

3. **Python virtual environment**
   ```bash
   # Recreate virtual environment
   cd apps/backend
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Node modules issues**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   pnpm install
   ```

## 📚 API Documentation

- **Development**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 🔗 Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **Redis Commander**: http://localhost:8081