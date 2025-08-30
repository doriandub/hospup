#!/bin/bash
# Deploy frontend to Vercel

echo "🚀 Deploying frontend to Vercel..."

# Navigate to project root
cd "$(dirname "$0")"

# Deploy to Vercel using npx (no global installation needed)
echo "📦 Deploying to Vercel with npx..."
npx vercel --prod

echo "✅ Frontend deployment completed!"
echo "🌐 Your app will be available at the URL shown above"