#!/bin/bash
# Script de configuration pour Render.com
# Installe FFmpeg et configure l'environnement pour le traitement vidéo

echo "🚀 Configuration Render pour traitement vidéo complexe..."

# Mise à jour des paquets système
apt-get update -y

# Installation FFmpeg (requis pour video_conversion_service)
echo "📹 Installation FFmpeg..."
apt-get install -y ffmpeg

# Vérification de l'installation FFmpeg
ffmpeg -version | head -1

# Configuration des variables d'environnement pour les modèles AI
export TRANSFORMERS_CACHE="/opt/render/project/src/.cache/transformers"
export HF_HOME="/opt/render/project/src/.cache/huggingface"

# Création des répertoires de cache
mkdir -p $TRANSFORMERS_CACHE
mkdir -p $HF_HOME

# Configuration PyTorch pour CPU (Render n'a pas de GPU)
export TORCH_HOME="/opt/render/project/src/.cache/torch"
mkdir -p $TORCH_HOME

echo "✅ Configuration Render terminée"
echo "FFmpeg: $(which ffmpeg)"
echo "Python: $(which python)"
echo "Cache dirs created: $TRANSFORMERS_CACHE, $HF_HOME, $TORCH_HOME"