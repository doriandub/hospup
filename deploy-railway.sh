#!/bin/bash
# Deploy backend to Railway

echo "🚂 Deploying backend to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    curl -fsSL https://railway.app/install.sh | sh
fi

# Navigate to project root
cd "$(dirname "$0")"

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway login

# Link to Railway project (if not already linked)
echo "🔗 Linking to Railway project..."
railway link

# Deploy to Railway
echo "📦 Deploying to Railway..."
railway up

echo "✅ Backend deployment completed!"
echo "🌐 Your API will be available at: https://your-project.railway.app"