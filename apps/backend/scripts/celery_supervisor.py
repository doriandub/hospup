#!/usr/bin/env python3
"""
Superviseur Celery - Surveillance et redémarrage automatique des workers
Résout les problèmes de crashes SIGSEGV de manière permanente
"""

import os
import sys
import signal
import subprocess
import time
import logging
import psutil
from pathlib import Path
from datetime import datetime, timedelta
import json

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/tmp/celery_supervisor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class CelerySupervisor:
    def __init__(self):
        self.worker_process = None
        self.beat_process = None
        self.restart_count = 0
        self.last_restart = None
        self.max_restarts_per_hour = 10
        
        # Configuration optimisée pour éviter SIGSEGV
        self.worker_config = {
            # Threading et processus
            'concurrency': 1,
            'pool': 'solo',  # Solo pool évite les forks problématiques
            'loglevel': 'info',
            
            # Limites de sécurité
            'max_tasks_per_child': 10,  # Redémarrer fréquemment
            'max_memory_per_child': 256000,  # 256MB limite mémoire
            
            # Timeouts
            'task_time_limit': 900,  # 15 minutes max par tâche
            'task_soft_time_limit': 780,  # 13 minutes soft
        }
        
        # Variables d'environnement pour stabilité
        self.env_vars = {
            # Optimisations OpenCV
            'OPENCV_IO_MAX_IMAGE_PIXELS': str(10**8),
            'OPENCV_FFMPEG_CAPTURE_OPTIONS': 'rtsp_transport;udp',
            
            # Optimisations FFmpeg  
            'FFMPEG_HIDE_BANNER': '1',
            'AV_LOG_FORCE_NOCOLOR': '1',
            
            # Python optimizations
            'PYTHONUNBUFFERED': '1',
            'PYTHONIOENCODING': 'utf-8',
            'MALLOC_ARENA_MAX': '2',  # Limiter malloc arenas
            
            # Threading
            'OMP_NUM_THREADS': '1',
            'MKL_NUM_THREADS': '1',
            'OPENBLAS_NUM_THREADS': '1',
        }
        
        # Signaux pour arrêt propre
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)
        
    def signal_handler(self, signum, frame):
        """Arrêt propre du superviseur"""
        logger.info(f"🛑 Signal {signum} reçu, arrêt du superviseur...")
        self.stop_all_processes()
        sys.exit(0)
    
    def check_restart_limits(self):
        """Vérifie si on peut redémarrer (limite anti-spam)"""
        now = datetime.now()
        
        if self.last_restart:
            # Reset compteur si plus d'une heure
            if now - self.last_restart > timedelta(hours=1):
                self.restart_count = 0
                
            # Trop de redémarrages dans l'heure
            if self.restart_count >= self.max_restarts_per_hour:
                logger.error(f"❌ Trop de redémarrages ({self.restart_count}) dans la dernière heure")
                return False
                
        return True
        
    def get_worker_cmd(self):
        """Commande worker optimisée contre SIGSEGV"""
        base_cmd = [
            sys.executable, '-m', 'celery',
            '-A', 'core.celery_app',
            'worker',
            f"--loglevel={self.worker_config['loglevel']}",
            f"--concurrency={self.worker_config['concurrency']}",
            f"--pool={self.worker_config['pool']}",
            f"--max-tasks-per-child={self.worker_config['max_tasks_per_child']}",
            f"--max-memory-per-child={self.worker_config['max_memory_per_child']}",
            f"--time-limit={self.worker_config['task_time_limit']}",
            f"--soft-time-limit={self.worker_config['task_soft_time_limit']}",
            '--without-gossip',
            '--without-mingle', 
            '--without-heartbeat',
            '--hostname=worker-stable@%h'
        ]
        return base_cmd
        
    def get_beat_cmd(self):
        """Commande beat pour tâches périodiques"""
        return [
            sys.executable, '-m', 'celery',
            '-A', 'core.celery_app',
            'beat',
            '--loglevel=info',
            '--pidfile=/tmp/celerybeat.pid'
        ]
    
    def start_worker(self):
        """Démarre le worker Celery avec config optimisée"""
        if not self.check_restart_limits():
            logger.error("❌ Limite de redémarrages atteinte, arrêt du superviseur")
            return False
            
        try:
            # Environnement optimisé
            env = os.environ.copy()
            env.update(self.env_vars)
            
            cmd = self.get_worker_cmd()
            logger.info(f"🚀 Démarrage worker: {' '.join(cmd)}")
            
            self.worker_process = subprocess.Popen(
                cmd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            # Statistiques de redémarrage
            self.restart_count += 1
            self.last_restart = datetime.now()
            
            logger.info(f"✅ Worker démarré (PID: {self.worker_process.pid}, restart #{self.restart_count})")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur démarrage worker: {e}")
            return False
            
    def start_beat(self):
        """Démarre Celery Beat pour les tâches périodiques"""
        try:
            env = os.environ.copy()
            env.update(self.env_vars)
            
            cmd = self.get_beat_cmd()
            logger.info(f"📅 Démarrage beat: {' '.join(cmd)}")
            
            self.beat_process = subprocess.Popen(
                cmd,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            logger.info(f"✅ Beat démarré (PID: {self.beat_process.pid})")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur démarrage beat: {e}")
            return False
    
    def is_process_healthy(self, process):
        """Vérifie si le processus est en vie et sain"""
        if not process:
            return False
            
        try:
            # Vérifier si le processus existe
            if process.poll() is not None:
                return False
                
            # Vérifier via psutil pour plus d'infos
            proc = psutil.Process(process.pid)
            if not proc.is_running():
                return False
                
            # Vérifier que ce n'est pas un zombie
            if proc.status() == psutil.STATUS_ZOMBIE:
                return False
                
            return True
            
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return False
            
    def get_process_stats(self, process):
        """Statistiques du processus pour monitoring"""
        if not process:
            return {}
            
        try:
            proc = psutil.Process(process.pid)
            return {
                'pid': process.pid,
                'status': proc.status(),
                'cpu_percent': proc.cpu_percent(),
                'memory_mb': proc.memory_info().rss / 1024 / 1024,
                'num_threads': proc.num_threads(),
                'create_time': datetime.fromtimestamp(proc.create_time())
            }
        except:
            return {'pid': process.pid, 'error': 'stats_unavailable'}
    
    def stop_process(self, process, name):
        """Arrêt propre d'un processus"""
        if not process:
            return
            
        try:
            logger.info(f"🛑 Arrêt de {name} (PID: {process.pid})")
            
            # SIGTERM d'abord
            process.terminate()
            
            # Attendre 10 secondes
            try:
                process.wait(timeout=10)
                logger.info(f"✅ {name} arrêté proprement")
                return
            except subprocess.TimeoutExpired:
                pass
            
            # SIGKILL si nécessaire
            logger.warning(f"⚠️ {name} ne répond pas, force kill...")
            process.kill()
            process.wait(timeout=5)
            logger.info(f"💀 {name} tué de force")
            
        except Exception as e:
            logger.error(f"❌ Erreur arrêt {name}: {e}")
            
    def stop_all_processes(self):
        """Arrête tous les processus"""
        if self.worker_process:
            self.stop_process(self.worker_process, "Worker")
            self.worker_process = None
            
        if self.beat_process:
            self.stop_process(self.beat_process, "Beat")
            self.beat_process = None
    
    def monitor_loop(self):
        """Boucle principale de surveillance"""
        logger.info("🎯 Démarrage superviseur Celery anti-crash")
        
        # Démarrage initial
        if not self.start_worker():
            logger.error("❌ Impossible de démarrer le worker initial")
            return
            
        if not self.start_beat():
            logger.warning("⚠️ Impossible de démarrer beat, continuons avec worker seul")
        
        # Boucle de surveillance
        while True:
            try:
                # Vérifier worker
                if not self.is_process_healthy(self.worker_process):
                    logger.warning("💥 Worker mort ou zombie détecté")
                    
                    if self.worker_process:
                        exit_code = self.worker_process.poll()
                        if exit_code == -11:  # SIGSEGV
                            logger.error("🧨 Crash SIGSEGV détecté, redémarrage avec config renforcée")
                        else:
                            logger.error(f"💀 Worker mort avec code: {exit_code}")
                    
                    self.stop_process(self.worker_process, "Worker")
                    self.worker_process = None
                    
                    if not self.start_worker():
                        logger.error("❌ Impossible de redémarrer worker, arrêt superviseur")
                        break
                
                # Vérifier beat 
                if self.beat_process and not self.is_process_healthy(self.beat_process):
                    logger.warning("💥 Beat mort détecté, redémarrage...")
                    self.stop_process(self.beat_process, "Beat")
                    self.beat_process = None
                    self.start_beat()
                
                # Stats périodiques (toutes les 2 minutes)
                if int(time.time()) % 120 == 0:
                    worker_stats = self.get_process_stats(self.worker_process)
                    logger.info(f"📊 Worker stats: {worker_stats}")
                
                time.sleep(5)  # Vérification toutes les 5 secondes
                
            except KeyboardInterrupt:
                logger.info("🛑 Interruption clavier, arrêt...")
                break
            except Exception as e:
                logger.error(f"❌ Erreur boucle surveillance: {e}")
                time.sleep(10)
        
        # Nettoyage final
        self.stop_all_processes()
        logger.info("🏁 Superviseur arrêté")

def main():
    """Point d'entrée"""
    # Changer vers le répertoire backend
    script_dir = Path(__file__).parent.parent
    os.chdir(script_dir)
    
    # Vérifier l'environnement virtuel
    if not os.path.exists('venv/bin/activate'):
        logger.error("❌ Environment virtuel non trouvé")
        sys.exit(1)
    
    # Activer l'environnement virtuel
    venv_python = str(Path('venv/bin/python').absolute())
    if not os.path.exists(venv_python):
        logger.error("❌ Python venv non trouvé")
        sys.exit(1)
    
    # Changer l'exécutable Python pour celui du venv
    sys.executable = venv_python
    
    logger.info("🎯 Initialisation du superviseur Celery...")
    supervisor = CelerySupervisor()
    supervisor.monitor_loop()

if __name__ == "__main__":
    main()