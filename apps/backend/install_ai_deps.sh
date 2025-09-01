#!/bin/bash

# Optimized AI dependencies installation script for Render
echo "🚀 Starting optimized AI dependencies installation..."

# Update system packages
echo "📦 Updating system packages..."
apt-get update -qq

# Install system dependencies for OpenCV and FFmpeg
echo "🎬 Installing FFmpeg and system libraries..."
apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1

# Upgrade pip and install build tools
echo "🔧 Upgrading pip and installing build tools..."
python -m pip install --upgrade pip wheel setuptools

# Install PyTorch CPU-only (much smaller than GPU version)
echo "🧠 Installing PyTorch CPU-only..."
pip install torch==2.1.0+cpu torchvision==0.16.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu \
    --no-cache-dir

# Install transformers and related packages
echo "🤖 Installing Transformers and AI packages..."
pip install --no-cache-dir \
    transformers==4.35.0 \
    accelerate==0.24.1 \
    sentencepiece==0.1.99

# Install OpenCV headless (no GUI dependencies)
echo "👁️ Installing OpenCV headless..."
pip install --no-cache-dir opencv-python-headless==4.8.1.78

# Verify installations
echo "✅ Verifying installations..."
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import transformers; print(f'Transformers: {transformers.__version__}')"
python -c "import cv2; print(f'OpenCV: {cv2.__version__}')"

# Clean up to reduce image size
echo "🧹 Cleaning up..."
apt-get clean
rm -rf /var/lib/apt/lists/*
pip cache purge

echo "🎉 AI dependencies installation completed!"