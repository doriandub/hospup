#!/bin/bash

# 🔍 Deployment Validation Script
# Validates that all deployment configurations are ready

echo "🔍 Validating Hospup deployment configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validation functions
validate_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 missing${NC}"
        return 1
    fi
}

validate_executable() {
    if [ -x "$1" ]; then
        echo -e "${GREEN}✅ $1 is executable${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $1 not executable, fixing...${NC}"
        chmod +x "$1"
        return 1
    fi
}

check_env_var() {
    local file=$1
    local var=$2
    if grep -q "$var" "$file"; then
        echo -e "${GREEN}✅ $var found in $file${NC}"
        return 0
    else
        echo -e "${RED}❌ $var missing in $file${NC}"
        return 1
    fi
}

# Start validation
echo ""
echo "📁 Checking deployment files..."

# Check main configuration files
validate_file "vercel.json"
validate_file "railway.json" 
validate_file "nixpacks.toml"
validate_file "start-railway.sh"

# Check deployment scripts
validate_file "deploy-vercel.sh"
validate_file "deploy-railway.sh"
validate_executable "deploy-vercel.sh"
validate_executable "deploy-railway.sh"
validate_executable "start-railway.sh"

# Check environment files
validate_file "apps/frontend/.env.production"
validate_file "apps/backend/.railway-env"

echo ""
echo "🔧 Checking configuration content..."

# Check frontend environment
if [ -f "apps/frontend/.env.production" ]; then
    check_env_var "apps/frontend/.env.production" "NEXT_PUBLIC_API_URL"
    check_env_var "apps/frontend/.env.production" "NEXT_PUBLIC_WS_URL"
fi

# Check backend environment
if [ -f "apps/backend/.railway-env" ]; then
    check_env_var "apps/backend/.railway-env" "DATABASE_URL"
    check_env_var "apps/backend/.railway-env" "REDIS_URL"
    check_env_var "apps/backend/.railway-env" "SECRET_KEY"
    check_env_var "apps/backend/.railway-env" "AWS_ACCESS_KEY_ID"
    check_env_var "apps/backend/.railway-env" "OPENAI_API_KEY"
fi

# Check package.json for frontend
if [ -f "apps/frontend/package.json" ]; then
    echo -e "${GREEN}✅ Frontend package.json exists${NC}"
    if grep -q '"build"' "apps/frontend/package.json"; then
        echo -e "${GREEN}✅ Build script found in frontend package.json${NC}"
    else
        echo -e "${RED}❌ Build script missing in frontend package.json${NC}"
    fi
fi

# Check backend requirements
if [ -f "apps/backend/requirements.txt" ]; then
    echo -e "${GREEN}✅ Backend requirements.txt exists${NC}"
else
    echo -e "${RED}❌ Backend requirements.txt missing${NC}"
fi

echo ""
echo "🌐 Checking CLI tools..."

# Check if CLI tools are available
if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI installed${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Run: npm install -g vercel${NC}"
fi

if command -v railway &> /dev/null; then
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
else
    echo -e "${YELLOW}⚠️  Railway CLI not found. Run: curl -fsSL https://railway.app/install.sh | sh${NC}"
fi

echo ""
echo "📋 Next steps:"
echo "1. 🚂 Deploy backend: ./deploy-railway.sh"
echo "2. 🔧 Update Railway environment variables from apps/backend/.railway-env"
echo "3. 📝 Update frontend URLs with real Railway backend URL"
echo "4. 🌐 Deploy frontend: ./deploy-vercel.sh"
echo "5. ✅ Test both deployments"

echo ""
echo -e "${GREEN}🎉 Validation completed!${NC}"