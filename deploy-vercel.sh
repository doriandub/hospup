#!/bin/bash
# Deploy frontend to Vercel

echo "🚀 Deploying frontend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to project root
cd "$(dirname "$0")"

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment completed!"
echo "🌐 Your app will be available at: https://your-domain.vercel.app"