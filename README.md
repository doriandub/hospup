# 🏨 Hospup-SaaS

AI-powered video generation platform for properties (hotels, Airbnb, restaurants, vacation rentals).

## ✨ Features

- 🤖 **AI Video Generation**: Create viral videos from text prompts or photos
- 🏢 **Multi-Property Management**: Manage multiple properties from one dashboard
- 🎬 **Viral Content Matching**: AI analyzes trending videos and adapts them to your content
- 📊 **Analytics Dashboard**: Track video performance and usage metrics
- 🌍 **Multi-Language Support**: Generate content in multiple languages
- ☁️ **Cloud Storage**: Secure file storage with AWS S3

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for styling
- **React Query** for state management
- **NextAuth.js** for authentication

### Backend
- **FastAPI** with async support
- **SQLAlchemy** + **PostgreSQL** for database
- **Redis** for caching and rate limiting
- **Celery** for background jobs
- **JWT** for authentication

### AI & Media Processing
- **OpenCLIP** for embeddings
- **PySceneDetect** for video analysis
- **ffmpeg** for video processing
- **Weaviate** for vector storage

### Infrastructure
- **Docker** for containerization
- **Turborepo** for monorepo management
- **AWS S3** for file storage
- **pnpm** for package management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hospup-saas
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development services**
   ```bash
   cd infrastructure/docker
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Setup backend**
   ```bash
   cd apps/backend
   source venv/bin/activate
   pip install -r requirements.txt
   alembic upgrade head
   ```

5. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd apps/backend
   uvicorn main:app --reload

   # Frontend (Terminal 2)
   cd apps/frontend
   pnpm dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs

## 📁 Project Structure

```
hospup-saas/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # FastAPI application
├── packages/
│   ├── shared-types/      # Shared TypeScript types
│   ├── ui-components/     # Reusable UI components
│   └── utils/             # Shared utilities
├── infrastructure/
│   ├── docker/            # Development containers
│   ├── k8s/              # Kubernetes manifests
│   └── terraform/         # Infrastructure as Code
├── docs/                  # Documentation
└── scripts/               # Build and deployment scripts
```

## 🔧 Development

### Available Scripts

```bash
# Root commands (Turborepo)
pnpm dev           # Start all apps in development
pnpm build         # Build all apps
pnpm test          # Run all tests
pnpm lint          # Lint all code
pnpm type-check    # TypeScript type checking

# Database management
pnpm db:migrate    # Run database migrations
pnpm db:seed       # Seed development data
```

### Environment Variables

Copy the example environment files and update with your values:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend  
cp apps/frontend/.env.example apps/frontend/.env.local
```

## 📖 Documentation

- [Development Guide](./docs/DEVELOPMENT.md)
- [API Documentation](http://localhost:8000/api/docs) (when running)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🔒 Security Features

- **Rate Limiting**: Redis-based sliding window rate limiting
- **CORS Protection**: Configurable CORS policies
- **Input Validation**: Strict Pydantic validation
- **JWT Authentication**: Secure token-based auth
- **SQL Injection Protection**: ORM-only database access
- **XSS Protection**: CSP headers and input sanitization

## 🧪 Testing

```bash
# Backend tests
cd apps/backend
pytest

# Frontend tests  
cd apps/frontend
pnpm test

# E2E tests
pnpm test:e2e
```

## 📊 Monitoring

- **Health Checks**: `/health` endpoint
- **Metrics**: Built-in request timing
- **Logging**: Structured JSON logging
- **Error Tracking**: Comprehensive error handling

## 🚢 Deployment

### Development
```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml up
```

### Production
See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@hospup.com
- 📚 Documentation: [docs/](./docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/hospup/hospup-saas/issues)

---

**Made with ❤️ by the Hospup Team**