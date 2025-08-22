#!/bin/bash

# Script de correction rapide pour le système de processing vidéo
echo "🔧 Fix automatique du système de processing vidéo Hospup"

cd "$(dirname "$0")"

# Activer l'environnement virtuel
source venv/bin/activate

echo "📊 Vérification du statut actuel..."
python scripts/recover_stuck_videos.py --status

echo ""
echo "🔍 Vérification de la santé du système..."
curl -s http://localhost:8000/api/v1/health | grep -E '"status":|"issues":'

echo ""
echo "🚨 Recherche des vidéos bloquées..."

# Vérifier s'il y a des vidéos bloquées
STUCK_COUNT=$(python -c "
import sys
sys.path.append('.')
from core.database import get_db
from models.video import Video
from datetime import datetime, timedelta
db = next(get_db())
cutoff = datetime.utcnow() - timedelta(minutes=5)
count = db.query(Video).filter(Video.status == 'processing', Video.created_at < cutoff).count()
db.close()
print(count)
")

if [ "$STUCK_COUNT" -gt 0 ]; then
    echo "⚠️  $STUCK_COUNT vidéo(s) bloquée(s) détectée(s)"
    echo "🔄 Relancement automatique du processing..."
    
    # Relancer les vidéos bloquées automatiquement
    python -c "
import sys
sys.path.append('.')
from core.database import get_db
from models.video import Video
from tasks.video_processing_tasks import process_uploaded_video
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

db = next(get_db())
try:
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    stuck_videos = db.query(Video).filter(
        Video.status == 'processing',
        Video.created_at < cutoff
    ).all()
    
    for video in stuck_videos:
        try:
            logger.info(f'🔄 Relancement: {video.title}')
            video_url = video.video_url
            if video_url.startswith('s3://'):
                s3_key = '/'.join(video_url.split('/')[3:])
            else:
                s3_key = f'properties/{video.property_id}/videos/{video.title}'
            
            task = process_uploaded_video.delay(str(video.id), s3_key)
            video.generation_job_id = task.id
            db.commit()
            logger.info(f'✅ Tâche relancée: {task.id}')
        except Exception as e:
            logger.error(f'❌ Erreur pour {video.title}: {e}')
finally:
    db.close()
"
    echo "✅ Relancement terminé"
else
    echo "✅ Aucune vidéo bloquée détectée"
fi

echo ""
echo "🔍 Vérification finale..."
sleep 3

# Nouveau statut
python scripts/recover_stuck_videos.py --status

echo ""
echo "💡 Conseils pour éviter les blocages futurs:"
echo "   1. Toujours démarrer les services avec: ./start_services.sh"
echo "   2. Vérifier la santé avec: curl http://localhost:8000/api/v1/health"
echo "   3. Surveiller les logs: tail -f logs/celery.log"
echo "   4. En cas de problème: ./fix_video_processing.sh"