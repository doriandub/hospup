#!/bin/bash
# Script d'installation FFmpeg pour Render

echo "🔧 Installing FFmpeg for Render deployment..."

# Update package list
apt-get update -y

# Install FFmpeg
apt-get install -y ffmpeg

# Test FFmpeg installation
ffmpeg -version

echo "✅ FFmpeg installation complete"