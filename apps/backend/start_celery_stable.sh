#!/bin/bash

# Script de lancement Celery anti-crash
# Solution permanente contre les crashes SIGSEGV

echo "🎯 Démarrage Celery avec configuration anti-crash"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$(dirname "$0")"

# Vérifications préliminaires
echo -e "${BLUE}🔍 Vérifications système...${NC}"

if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Environment virtuel non trouvé${NC}"
    exit 1
fi

if [ ! -f "venv/bin/activate" ]; then
    echo -e "${RED}❌ Script d'activation venv non trouvé${NC}"
    exit 1
fi

# Activation de l'environnement virtuel
echo -e "${BLUE}🔧 Activation environnement virtuel...${NC}"
source venv/bin/activate

# Vérification des dépendances critiques
echo -e "${BLUE}📦 Vérification dépendances...${NC}"
python -c "import celery, redis, cv2, ffmpeg; print('✅ Toutes les dépendances présentes')" || {
    echo -e "${RED}❌ Dépendances manquantes${NC}"
    exit 1
}

# Configuration environnement anti-crash
echo -e "${BLUE}⚙️ Configuration environnement anti-crash...${NC}"
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export NUMEXPR_NUM_THREADS=1
export OPENCV_IO_MAX_IMAGE_PIXELS=100000000
export OPENCV_FFMPEG_CAPTURE_OPTIONS="rtsp_transport;udp"
export FFMPEG_HIDE_BANNER=1
export AV_LOG_FORCE_NOCOLOR=1
export MALLOC_ARENA_MAX=2
export MALLOC_TRIM_THRESHOLD_=131072
export PYTHONUNBUFFERED=1
export PYTHONIOENCODING=utf-8

# Nettoyage des processus Celery existants
echo -e "${YELLOW}🧹 Nettoyage des processus existants...${NC}"
pkill -f "celery.*worker" 2>/dev/null || true
pkill -f "celery.*beat" 2>/dev/null || true
sleep 2

# Test de connexion Redis
echo -e "${BLUE}🔌 Test connexion Redis...${NC}"
python -c "
import redis
try:
    r = redis.Redis(host='localhost', port=6379, db=0)
    r.ping()
    print('✅ Redis connecté')
except Exception as e:
    print(f'❌ Redis inaccessible: {e}')
    exit(1)
" || exit 1

# Fonction pour gérer l'arrêt propre
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt en cours...${NC}"
    pkill -P $$ 2>/dev/null || true
    pkill -f "celery.*worker" 2>/dev/null || true
    pkill -f "celery.*beat" 2>/dev/null || true
    echo -e "${GREEN}✅ Processus arrêtés${NC}"
    exit 0
}

# Piège pour arrêt propre
trap cleanup SIGTERM SIGINT

# Choix du mode de lancement
echo -e "${BLUE}🚀 Choisissez le mode de lancement:${NC}"
echo "1) Worker seul (recommandé pour tests)"  
echo "2) Worker + Beat (complet avec tâches périodiques)"
echo "3) Superviseur automatique (redémarrage auto)"
read -p "Choix [1-3]: " choice

case $choice in
    1)
        echo -e "${GREEN}🎯 Lancement Worker seul...${NC}"
        celery -A core.celery_app worker \
            --loglevel=info \
            --concurrency=1 \
            --pool=solo \
            --max-tasks-per-child=10 \
            --max-memory-per-child=256000 \
            --time-limit=900 \
            --soft-time-limit=780 \
            --without-gossip \
            --without-mingle \
            --without-heartbeat \
            --hostname=stable-worker@%h
        ;;
    2)
        echo -e "${GREEN}🎯 Lancement Worker + Beat...${NC}"
        # Lancer Beat en arrière-plan
        celery -A core.celery_app beat --loglevel=info --pidfile=/tmp/celerybeat.pid &
        BEAT_PID=$!
        echo -e "${GREEN}📅 Beat démarré (PID: $BEAT_PID)${NC}"
        
        # Lancer Worker en avant-plan
        celery -A core.celery_app worker \
            --loglevel=info \
            --concurrency=1 \
            --pool=solo \
            --max-tasks-per-child=10 \
            --max-memory-per-child=256000 \
            --time-limit=900 \
            --soft-time-limit=780 \
            --without-gossip \
            --without-mingle \
            --without-heartbeat \
            --hostname=stable-worker@%h
        ;;
    3)
        echo -e "${GREEN}🎯 Lancement Superviseur automatique...${NC}"
        if [ ! -f "scripts/celery_supervisor.py" ]; then
            echo -e "${RED}❌ Superviseur non trouvé${NC}"
            exit 1
        fi
        python scripts/celery_supervisor.py
        ;;
    *)
        echo -e "${RED}❌ Choix invalide${NC}"
        exit 1
        ;;
esac