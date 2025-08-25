"""
Configuration de déploiement automatique
Détecte l'environnement (local/Vercel) et configure le traitement vidéo approprié
"""

import os
from typing import Literal

DeploymentMode = Literal["local", "vercel", "production"]

class DeploymentConfig:
    """Configuration automatique basée sur l'environnement de déploiement"""
    
    @staticmethod
    def get_deployment_mode() -> DeploymentMode:
        """
        Détecte automatiquement l'environnement de déploiement
        """
        # Vercel injecte automatiquement cette variable
        if os.getenv("VERCEL") == "1":
            return "vercel"
        
        # Railway, Render, Heroku, etc. ont généralement PORT défini
        if os.getenv("PORT") and not os.getenv("IS_LOCAL_DEV"):
            return "production"
        
        # Par défaut : environnement local
        return "local"
    
    @staticmethod
    def should_use_async_processing() -> bool:
        """
        Détermine si le traitement asynchrone (Celery) doit être utilisé
        """
        mode = DeploymentConfig.get_deployment_mode()
        
        # Local : utilise Celery si disponible
        if mode == "local":
            try:
                # Teste si Redis est disponible
                import redis
                r = redis.Redis(host='localhost', port=6379, decode_responses=True)
                r.ping()
                return True
            except:
                return False
        
        # Vercel : pas de support pour les processus persistants
        if mode == "vercel":
            return False
        
        # Production : dépend de la configuration Redis
        if mode == "production":
            redis_url = os.getenv("REDIS_URL") or os.getenv("UPSTASH_REDIS_REST_URL")
            return bool(redis_url)
        
        return False
    
    @staticmethod
    def get_max_processing_time() -> int:
        """
        Temps maximum de traitement selon l'environnement (en secondes)
        """
        mode = DeploymentConfig.get_deployment_mode()
        
        if mode == "vercel":
            return 30  # Vercel Hobby : 10s, Pro : 60s - on reste conservatif
        elif mode == "production":
            return 120  # 2 minutes pour la production
        else:
            return 300  # 5 minutes en local
    
    @staticmethod
    def get_processing_config() -> dict:
        """
        Configuration complète du traitement selon l'environnement
        """
        mode = DeploymentConfig.get_deployment_mode()
        use_async = DeploymentConfig.should_use_async_processing()
        
        return {
            "mode": mode,
            "use_async_processing": use_async,
            "max_processing_time": DeploymentConfig.get_max_processing_time(),
            "max_frames_for_ai": 3 if mode == "vercel" else 8,
            "enable_video_conversion": True,
            "enable_thumbnail_generation": True,
            "enable_ai_description": True,
            "processing_timeout": {
                "video_conversion": 20 if mode == "vercel" else 60,
                "ai_analysis": 15 if mode == "vercel" else 45,
                "thumbnail_generation": 10 if mode == "vercel" else 30
            }
        }

# Instance globale pour la configuration
deployment_config = DeploymentConfig()