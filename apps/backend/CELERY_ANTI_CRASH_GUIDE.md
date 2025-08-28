# 🛡️ Guide Anti-Crash Celery Workers

## Problème résolu : Crashes SIGSEGV récurrents

Les workers Celery crashaient constamment avec des erreurs SIGSEGV (signal 11), causant des blocages de génération vidéo. Ce guide présente la solution complète et permanente.

## 🔍 Causes identifiées des crashes SIGSEGV

1. **Compatibilité Python 3.13 + ARM64** - Version récente avec problèmes de threading
2. **Forks problématiques** - Pool par défaut cause des conflits mémoire
3. **Threading non contrôlé** - OpenCV/FFmpeg avec trop de threads
4. **Fuites mémoire** - Workers qui accumulent de la mémoire
5. **Conflits bibliothèques natives** - OpenCV 4.12 + FFmpeg 7.1

## ✅ Solutions implémentées

### 1. Configuration Celery optimisée (`core/celery_app.py`)

```python
# Configuration anti-crash
worker_pool='solo'                    # Évite les forks
worker_max_tasks_per_child=10         # Redémarrage fréquent  
worker_max_memory_per_child=256000    # Limite mémoire stricte
task_time_limit=15 * 60               # Timeouts réduits
```

### 2. Initialisation worker avec optimisations

```python
@worker_process_init.connect
def worker_process_init_handler(signal, sender, **kwargs):
    # Threading limité
    os.environ['OMP_NUM_THREADS'] = '1'
    cv2.setNumThreads(1)
    
    # Limite mémoire processus
    resource.setrlimit(resource.RLIMIT_AS, (1GB, 1GB))
```

### 3. Scripts de lancement sécurisés

- **`start_celery_stable.sh`** - Script interactif avec choix de mode
- **`scripts/celery_supervisor.py`** - Superviseur auto-restart

## 🚀 Utilisation

### Option 1: Script interactif (Recommandé)
```bash
cd apps/backend
./start_celery_stable.sh
```

**Modes disponibles:**
1. Worker seul (idéal pour tests)
2. Worker + Beat (production complète)  
3. Superviseur automatique (redémarrage auto)

### Option 2: Commande directe optimisée
```bash
cd apps/backend
source venv/bin/activate

# Variables d'environnement anti-crash
export OMP_NUM_THREADS=1
export OPENCV_IO_MAX_IMAGE_PIXELS=100000000
export MALLOC_ARENA_MAX=2

# Lancement worker stable
celery -A core.celery_app worker \
  --pool=solo \
  --concurrency=1 \
  --max-tasks-per-child=10 \
  --max-memory-per-child=256000 \
  --time-limit=900 \
  --without-gossip \
  --without-mingle \
  --without-heartbeat
```

### Option 3: Superviseur automatique
```bash
cd apps/backend
python scripts/celery_supervisor.py
```

## 🔧 Configuration des variables d'environnement

Le système configure automatiquement:

```bash
# Threading control
OMP_NUM_THREADS=1
MKL_NUM_THREADS=1  
OPENBLAS_NUM_THREADS=1

# OpenCV stability
OPENCV_IO_MAX_IMAGE_PIXELS=100000000
OPENCV_FFMPEG_CAPTURE_OPTIONS="rtsp_transport;udp"

# Memory management  
MALLOC_ARENA_MAX=2
MALLOC_TRIM_THRESHOLD_=131072

# FFmpeg stability
FFMPEG_HIDE_BANNER=1
AV_LOG_FORCE_NOCOLOR=1
```

## 🏥 Système de surveillance et recovery

### Recovery automatique intégré
- **Fréquence**: Toutes les 3 minutes  
- **Détection**: Vidéos bloquées > 5 minutes
- **Action**: Marque comme "failed" pour retry manuel

### Superviseur avancé (`celery_supervisor.py`)
- **Surveillance**: Processus worker en temps réel
- **Détection crash**: SIGSEGV, zombies, timeouts
- **Redémarrage**: Automatique avec limites anti-spam
- **Logs**: Complets avec statistiques

### Monitoring en temps réel
```python
# Stats processus toutes les 2 minutes
worker_stats = {
    'pid': process.pid,
    'cpu_percent': proc.cpu_percent(), 
    'memory_mb': proc.memory_info().rss / 1024 / 1024,
    'num_threads': proc.num_threads()
}
```

## 📊 Métriques de stabilité

### Limites de sécurité
- **Max tâches par worker**: 10 (puis redémarrage)
- **Max mémoire par worker**: 256MB
- **Timeout tâche**: 15 minutes
- **Max redémarrages/heure**: 10

### Pool de workers
- **Type**: `solo` (pas de fork)
- **Concurrency**: 1 (une tâche à la fois)
- **Prefetch**: 1 (pas de buffer)

## 🔍 Diagnostic et troubleshooting

### Vérifier l'état des workers
```bash
# Processus actifs
ps aux | grep celery

# Logs en temps réel  
tail -f /tmp/celery_supervisor.log

# État Redis
redis-cli ping
```

### Logs importants
- **Worker init**: `"✅ Worker process initialized avec optimisations anti-crash"`
- **OpenCV config**: `"✅ OpenCV configuré en single-thread"`
- **Memory limit**: `"✅ Limite mémoire processus configurée (1GB)"`

### En cas de crash persistant
1. Vérifier les logs: `/tmp/celery_supervisor.log`
2. Vérifier Redis: `redis-cli ping`
3. Redémarrer avec superviseur: `python scripts/celery_supervisor.py`

## ⚡ Performance et optimisations

### Avantages de la solution
- ✅ **Stabilité**: Plus de crashes SIGSEGV
- ✅ **Monitoring**: Surveillance temps réel 
- ✅ **Recovery**: Redémarrage automatique
- ✅ **Performance**: Génération vidéo rapide maintenue
- ✅ **Simplicité**: Scripts prêts à l'emploi

### Trade-offs acceptés  
- 🔄 Redémarrages plus fréquents (tous les 10 tâches)
- 📉 Une seule tâche à la fois par worker
- 💾 Limite mémoire stricte (256MB)

## 🎯 Résultat final

**Avant**: Workers crashaient constamment, génération vidéo bloquée
**Après**: Workers stables, génération vidéo fiable, monitoring complet

La solution garantit un système de génération vidéo robuste et fiable, avec redémarrage automatique en cas de problème.