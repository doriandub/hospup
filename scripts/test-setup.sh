#!/bin/bash

echo "🧪 Testing Hospup-SaaS Setup"
echo "============================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking project structure...${NC}"

# Check if all main directories exist
directories=("apps/frontend" "apps/backend" "packages/shared-types" "infrastructure/docker")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $dir${NC}"
    else
        echo -e "${RED}❌ $dir${NC}"
    fi
done

echo ""
echo -e "${YELLOW}📦 Checking dependencies...${NC}"

# Check if pnpm is installed
if command -v pnpm &> /dev/null; then
    echo -e "${GREEN}✅ pnpm installed${NC}"
else
    echo -e "${RED}❌ pnpm not found${NC}"
fi

# Check if Python venv exists
if [ -d "apps/backend/venv" ]; then
    echo -e "${GREEN}✅ Python virtual environment${NC}"
else
    echo -e "${YELLOW}⚠️  Python virtual environment not found${NC}"
fi

# Check if Docker is running
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
else
    echo -e "${RED}❌ Docker is not running${NC}"
fi

echo ""
echo -e "${YELLOW}🔧 Testing builds...${NC}"

# Test shared-types build
if pnpm build --filter @hospup/shared-types > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Shared types build${NC}"
else
    echo -e "${RED}❌ Shared types build failed${NC}"
fi

# Test TypeScript checking
if pnpm type-check > /dev/null 2>&1; then
    echo -e "${GREEN}✅ TypeScript type checking${NC}"
else
    echo -e "${RED}❌ TypeScript type checking failed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup test completed!${NC}"
echo ""
echo -e "${YELLOW}📋 To start development:${NC}"
echo "  ./scripts/dev-setup.sh"