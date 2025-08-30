#!/bin/bash
# Deploy backend to Railway

echo "🚂 Deploying backend to Railway..."

# Navigate to project root
cd "$(dirname "$0")"

# Download and use Railway CLI directly
echo "📥 Getting Railway CLI..."
curl -L https://github.com/railwayapp/cli/releases/latest/download/railway_darwin_amd64.tar.gz | tar xz
chmod +x railway

# Login to Railway (if not already logged in)
echo "🔐 Railway authentication..."
./railway login

# Link to Railway project (if not already linked)
echo "🔗 Linking to Railway project..."
./railway link

# Deploy to Railway
echo "📦 Deploying to Railway..."
./railway up

echo "✅ Backend deployment completed!"
echo "🌐 Your API will be available at the URL shown above"