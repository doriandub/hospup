#!/bin/bash

echo "🚀 Hospup-SaaS Development Setup"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Starting development services...${NC}"

# Start PostgreSQL and Redis
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d

echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check if services are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Development services are running!${NC}"
    
    echo ""
    echo -e "${GREEN}📋 Service URLs:${NC}"
    echo "  🗄️  PostgreSQL: localhost:5432"
    echo "  🔴 Redis: localhost:6379"  
    echo "  🔧 Redis Commander: http://localhost:8081"
    
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "  1. Setup backend:"
    echo "     cd apps/backend"
    echo "     source venv/bin/activate"
    echo "     alembic upgrade head"
    echo "     uvicorn main:app --reload"
    echo ""
    echo "  2. Setup frontend (in another terminal):"
    echo "     cd apps/frontend"
    echo "     pnpm dev"
    echo ""
    echo "  3. Access the application:"
    echo "     🌐 Frontend: http://localhost:3000"
    echo "     🔧 Backend API: http://localhost:8000"
    echo "     📚 API Docs: http://localhost:8000/api/docs"
    
else
    echo -e "${RED}❌ Some services failed to start. Check the logs:${NC}"
    docker-compose -f docker-compose.dev.yml logs
fi

cd ../..