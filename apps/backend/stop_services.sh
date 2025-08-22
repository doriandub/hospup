#!/bin/bash

# Script pour arrêter tous les services Hospup
echo "🛑 Arrêt des services Hospup..."

# Fonction pour arrêter un service
stop_service() {
    local service_name="$1"
    local process_pattern="$2"
    
    echo "🔄 Arrêt de $service_name..."
    
    # Tuer les processus qui correspondent au pattern
    pkill -f "$process_pattern" 2>/dev/null
    
    # Attendre que les processus se terminent proprement
    sleep 2
    
    # Vérifier si des processus persistent et les forcer à s'arrêter
    if pgrep -f "$process_pattern" > /dev/null 2>&1; then
        echo "⚠️ Arrêt forcé de $service_name..."
        pkill -9 -f "$process_pattern" 2>/dev/null
        sleep 1
    fi
    
    echo "✅ $service_name arrêté"
}

# Arrêter les services dans l'ordre inverse de démarrage
stop_service "Frontend (npm)" "npm run dev"
stop_service "Celery Beat" "celery -A core.celery_app beat"
stop_service "Celery Worker" "celery -A core.celery_app worker"
stop_service "Backend API" "python main.py"

# Optionnel: arrêter Redis si souhaité (décommentez la ligne suivante)
# brew services stop redis

echo ""
echo "✅ Tous les services ont été arrêtés!"
echo ""
echo "💡 Pour redémarrer tous les services:"
echo "   ./start_services.sh"