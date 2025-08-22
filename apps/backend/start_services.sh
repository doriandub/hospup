#!/bin/bash

# Script de démarrage automatique pour tous les services Hospup
echo "🚀 Démarrage des services Hospup..."

# Se placer dans le répertoire backend
cd "$(dirname "$0")"

# Activer l'environnement virtuel
source venv/bin/activate

# Fonction pour démarrer un service en arrière-plan
start_service() {
    local service_name="$1"
    local command="$2"
    
    echo "🔄 Démarrage de $service_name..."
    
    # Tuer les processus existants si ils existent
    pkill -f "$command" 2>/dev/null || true
    
    # Attendre que les processus se terminent
    sleep 2
    
    # Démarrer le service
    eval "$command" &
    local pid=$!
    
    echo "✅ $service_name démarré avec PID: $pid"
    
    # Attendre un peu pour vérifier que le service démarre correctement
    sleep 3
    
    if ps -p $pid > /dev/null 2>&1; then
        echo "✅ $service_name fonctionne correctement"
    else
        echo "❌ Erreur: $service_name n'a pas pu démarrer"
        return 1
    fi
}

# Démarrer Redis si nécessaire (pour Celery)
if ! redis-cli ping > /dev/null 2>&1; then
    echo "🔄 Démarrage de Redis..."
    brew services start redis
    sleep 3
fi

# Démarrer le serveur FastAPI backend
start_service "Backend API" "python main.py"

# Démarrer le worker Celery pour le processing vidéo
start_service "Celery Worker" "celery -A core.celery_app worker --loglevel=info --concurrency=8"

# Démarrer Celery Beat pour les tâches périodiques (récupération automatique)
start_service "Celery Beat (Auto-Recovery)" "celery -A core.celery_app beat --loglevel=info"

# Démarrer le frontend (dans un autre terminal)
echo "🔄 Démarrage du frontend..."
cd ../frontend
PORT=3000 npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend démarré avec PID: $FRONTEND_PID"

echo ""
echo "🎉 Tous les services sont démarrés!"
echo ""
echo "📝 Services actifs:"
echo "   - Backend API: http://localhost:8000"
echo "   - Frontend: http://localhost:3000"
echo "   - Celery Worker: actif pour le processing vidéo"
echo "   - Celery Beat: récupération automatique toutes les 2min"
echo "   - Redis: actif pour les tâches Celery"
echo ""
echo "💡 Pour arrêter tous les services:"
echo "   ./stop_services.sh"
echo ""
echo "📊 Pour voir les logs Celery en temps réel:"
echo "   tail -f logs/celery.log"

# Garder le script actif
wait