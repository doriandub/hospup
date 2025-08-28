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
        "tasks.video_generation_v3",  # Only keep v3 - the active version
        "tasks.video_processing_tasks",
        "tasks.recovery_tasks",
        "tasks.video_recovery_tasks"
    ]
)

# Configuration robuste anti-crash SIGSEGV
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
    
    # Task execution - timeouts réduits pour éviter les blocages
    task_track_started=True,
    task_time_limit=15 * 60,  # 15 minutes max (réduit)
    task_soft_time_limit=13 * 60,  # 13 minutes soft limit (réduit)
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Worker configuration anti-crash
    worker_prefetch_multiplier=1,  # Une tâche à la fois
    worker_max_tasks_per_child=10,  # Redémarrage fréquent (réduit de 50 à 10)
    worker_max_memory_per_child=256000,  # 256MB limite (réduit de 512MB)
    worker_pool='solo',  # Pool solo pour éviter les forks problématiques
    worker_disable_rate_limits=True,
    worker_hijack_root_logger=False,
    
    # Results
    result_expires=1800,  # 30 minutes (réduit)
    
    # Error handling renforcé
    task_ignore_result=False,
    
    # Retry configuration
    task_default_retry_delay=30,  # 30 secondes (réduit)
    task_max_retries=2,  # Réduit de 3 à 2
    
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
    """Initialize worker process with anti-crash optimizations"""
    import os
    import threading
    
    logger.info(f"🚀 Initializing worker process: {sender}")
    
    # Optimisations environnement pour éviter SIGSEGV
    os.environ.update({
        # Threading limits pour éviter les conflits
        'OMP_NUM_THREADS': '1',
        'MKL_NUM_THREADS': '1', 
        'OPENBLAS_NUM_THREADS': '1',
        'NUMEXPR_NUM_THREADS': '1',
        
        # OpenCV optimizations
        'OPENCV_IO_MAX_IMAGE_PIXELS': str(10**8),
        'OPENCV_FFMPEG_CAPTURE_OPTIONS': 'rtsp_transport;udp',
        
        # FFmpeg stability
        'FFMPEG_HIDE_BANNER': '1',
        'AV_LOG_FORCE_NOCOLOR': '1',
        
        # Memory management
        'MALLOC_ARENA_MAX': '2',
        'MALLOC_TRIM_THRESHOLD_': '131072',
        
        # Python optimizations
        'PYTHONUNBUFFERED': '1',
        'PYTHONIOENCODING': 'utf-8',
    })
    
    # Forcer un seul thread pour OpenCV
    try:
        import cv2
        cv2.setNumThreads(1)
        logger.info("✅ OpenCV configuré en single-thread")
    except ImportError:
        pass
        
    # Limite de mémoire du processus
    try:
        import resource
        # Limite de mémoire virtuelle à 1GB
        resource.setrlimit(resource.RLIMIT_AS, (1024*1024*1024, 1024*1024*1024))
        logger.info("✅ Limite mémoire processus configurée (1GB)")
    except:
        pass
        
    logger.info("✅ Worker process initialized avec optimisations anti-crash")