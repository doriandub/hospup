from celery import Celery
from celery.signals import worker_process_init
from core.config import settings
import logging

logger = logging.getLogger(__name__)

# Celery app configuration
celery_app = Celery(
    "hospup-video-processor",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    include=[
        "tasks.video_generation_v2",
        "tasks.video_generation_v3",
        "tasks.video_processing_tasks",
        "tasks.recovery_tasks",
        "tasks.video_recovery_tasks"
    ]
)

# Robust configuration for production
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
    
    # Task execution
    task_track_started=True,
    task_time_limit=20 * 60,  # 20 minutes max
    task_soft_time_limit=18 * 60,  # 18 minutes soft limit
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Worker configuration
    worker_prefetch_multiplier=1,  # One task at a time per worker
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks
    worker_max_memory_per_child=512000,  # 512MB memory limit
    
    # Results
    result_expires=3600,  # Results expire after 1 hour
    
    # Error handling
    # task_routes={
    #     "tasks.video_generation_v2.*": {"queue": "video_generation"}
    # },
    
    # Retry configuration
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        'recover-stuck-videos': {
            'task': 'video_recovery.check_stuck_videos',
            'schedule': 180.0,  # Every 3 minutes
            'kwargs': {
                'timeout_minutes': 5,  # Videos stuck for more than 5 minutes
                'max_retries': 2
            }
        },
        'cleanup-old-failed-videos': {
            'task': 'video_recovery.cleanup_old_failed_videos', 
            'schedule': 24 * 60 * 60.0,  # Once per day
            'kwargs': {
                'days_old': 7  # Delete failed videos older than 7 days
            }
        }
    },
)

@worker_process_init.connect
def worker_process_init_handler(signal, sender, **kwargs):
    """Initialize worker process"""
    logger.info(f"Initializing worker process: {sender}")
    # Any worker-specific initialization here