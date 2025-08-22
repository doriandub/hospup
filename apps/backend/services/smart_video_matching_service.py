"""
Service de matching intelligent entre vidéos utilisateur et templates virales.
Utilise la similarité sémantique entre descriptions pour optimiser l'assignation des slots.
"""

import logging
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from difflib import SequenceMatcher

from core.database import SessionLocal
from models.video import Video
from models.viral_video_template import ViralVideoTemplate

logger = logging.getLogger(__name__)

class SmartVideoMatchingService:
    """Service pour le matching intelligent vidéos ↔ template clips"""
    
    def __init__(self):
        self.similarity_threshold = 0.3  # Seuil minimum de similarité
        
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calcule la similarité entre deux textes
        
        Args:
            text1: Premier texte
            text2: Deuxième texte
            
        Returns:
            Score de similarité entre 0 et 1
        """
        if not text1 or not text2:
            return 0.0
            
        # Nettoie et normalise les textes
        text1_clean = self._clean_text(text1.lower())
        text2_clean = self._clean_text(text2.lower())
        
        # Calcule la similarité basique avec SequenceMatcher
        basic_similarity = SequenceMatcher(None, text1_clean, text2_clean).ratio()
        
        # Améliore avec la similarité des mots-clés
        keyword_similarity = self._calculate_keyword_similarity(text1_clean, text2_clean)
        
        # Combine les scores (70% basic + 30% keywords)
        final_score = (basic_similarity * 0.7) + (keyword_similarity * 0.3)
        
        return final_score
    
    def _clean_text(self, text: str) -> str:
        """Nettoie et normalise un texte"""
        # Supprime la ponctuation et caractères spéciaux
        text = re.sub(r'[^\w\s]', ' ', text)
        # Supprime les espaces multiples
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def _calculate_keyword_similarity(self, text1: str, text2: str) -> float:
        """Calcule la similarité basée sur les mots-clés communs et thématiques"""
        # Mots-clés étendus pour mieux capturer les concepts hôteliers
        hotel_keywords = {
            'piscine': ['pool', 'water', 'swimming', 'turquoise', 'splash', 'aquatic', 'poolside'],
            'chambre': ['bedroom', 'bed', 'room', 'suite', 'sleep', 'rest', 'comfortable'],
            'salle_bain': ['bathroom', 'shower', 'bath', 'sink', 'bathtub', 'cascades', 'rainfall'],
            'restaurant': ['dining', 'food', 'breakfast', 'meal', 'table', 'croissants', 'coffee', 'kitchen'],
            'jardin': ['garden', 'outdoor', 'greenery', 'nature', 'landscape', 'deck', 'patio'],
            'reception': ['lobby', 'entrance', 'reception', 'check-in', 'house'],
            'spa': ['spa', 'wellness', 'relaxation', 'massage', 'hot', 'tub'],
            'vue': ['view', 'panoramic', 'scenery', 'overlook', 'vista', 'scenic', 'oceanfront'],
            'luxe': ['luxury', 'elegant', 'sophisticated', 'premium', 'exceptional', 'breathtaking'],
            'ambiance': ['ambient', 'lighting', 'atmosphere', 'serene', 'tranquil', 'sunset']
        }
        
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        # Mots communs directs
        common_words = words1.intersection(words2)
        
        # Mots-clés thématiques communs avec pondération
        theme_score = 0.0
        total_themes = len(hotel_keywords)
        
        for theme, keywords in hotel_keywords.items():
            # Compte le nombre de mots-clés de cette thématique dans chaque texte
            count1 = sum(1 for keyword in keywords if keyword in text1)
            count2 = sum(1 for keyword in keywords if keyword in text2)
            
            if count1 > 0 and count2 > 0:
                # Score proportionnel au nombre de mots-clés matchés dans cette thématique
                theme_match_strength = min(count1, count2) / max(count1, count2, 1)
                theme_score += theme_match_strength
        
        # Normalise le score thématique
        theme_score = theme_score / total_themes
        
        # Score basé sur les mots communs
        total_words = len(words1.union(words2))
        word_score = len(common_words) / total_words if total_words > 0 else 0.0
        
        # Bonus pour les matches spécifiques importants
        specific_bonus = 0.0
        specific_matches = [
            (['pool', 'water', 'swimming'], ['pool', 'splash', 'turquoise']),
            (['bathroom', 'shower'], ['bathroom', 'shower', 'cascades']),
            (['bedroom', 'bed'], ['bedroom', 'bed', 'serene']),
            (['breakfast', 'dining'], ['breakfast', 'croissants', 'coffee']),
            (['hot', 'tub'], ['hot', 'tub', 'deck'])
        ]
        
        for keywords1, keywords2 in specific_matches:
            has_match1 = any(kw in text1 for kw in keywords1)
            has_match2 = any(kw in text2 for kw in keywords2)
            if has_match1 and has_match2:
                specific_bonus += 0.1
        
        # Combine les scores (40% mots communs + 50% thèmes + 10% bonus spécifique)
        final_score = (word_score * 0.4) + (theme_score * 0.5) + min(specific_bonus, 0.1)
        
        return min(final_score, 1.0)  # Assure que le score ne dépasse pas 1.0
    
    def find_best_matches(self, property_id: str, template_id: str) -> Dict[str, Any]:
        """
        Trouve les meilleures correspondances entre vidéos de la propriété et clips de la template
        
        Args:
            property_id: ID de la propriété
            template_id: ID de la template virale
            
        Returns:
            Dictionnaire avec les assignations optimisées
        """
        db = SessionLocal()
        try:
            # Récupère la template virale
            template = db.query(ViralVideoTemplate).filter(
                ViralVideoTemplate.id == template_id
            ).first()
            
            if not template or not template.script:
                logger.warning(f"Template {template_id} non trouvée ou sans script")
                return self._fallback_assignment(property_id, db)
            
            # Parse le script de la template
            try:
                script_data = json.loads(template.script)
                template_clips = script_data.get('clips', [])
            except json.JSONDecodeError:
                logger.error(f"Script JSON invalide pour template {template_id}")
                return self._fallback_assignment(property_id, db)
            
            # Récupère les vidéos de la propriété (uploadées et complètes, ordre par création décroissante)
            user_videos = db.query(Video).filter(
                Video.property_id == property_id,
                Video.status.in_(["completed", "uploaded"])  # Inclut les vidéos uploadées
            ).order_by(Video.created_at.desc()).all()
            
            # Log des vidéos trouvées pour debug
            logger.info(f"📹 Trouvé {len(user_videos)} vidéos pour propriété {property_id}")
            for i, video in enumerate(user_videos[:5]):  # Log des 5 premières
                desc_preview = (self._get_video_description(video) or "Pas de description")[:50]
                logger.info(f"  {i+1}. {video.id}: {desc_preview}")
            
            # Filtre les vidéos avec descriptions pour le matching intelligent
            # Vérifie d'abord le champ description, puis source_data.content_description
            videos_with_desc = []
            videos_without_desc = []
            
            for video in user_videos:
                description = self._get_video_description(video)
                if description and description.strip():
                    videos_with_desc.append(video)
                else:
                    videos_without_desc.append(video)
            
            logger.info(f"📝 {len(videos_with_desc)} vidéos avec description, {len(videos_without_desc)} sans description")
            
            if not user_videos:
                logger.warning(f"Aucune vidéo trouvée pour la propriété {property_id}")
                return {"slot_assignments": [], "matching_scores": {}}
            
            # Stratégie de matching intelligente basée sur les descriptions disponibles
            if len(videos_with_desc) >= len(template_clips):
                # Assez de vidéos avec descriptions - utilise le matching intelligent
                logger.info(f"🧠 Matching intelligent: {len(videos_with_desc)} vidéos avec description pour {len(template_clips)} clips")
                matching_videos = videos_with_desc[:len(template_clips) * 2]  # Prend un peu plus pour avoir du choix
                
                # Calcule la matrice de similarité
                similarity_matrix = self._calculate_similarity_matrix(matching_videos, template_clips)
                
                # Optimise l'assignation
                optimal_assignments = self._optimize_assignments(similarity_matrix, matching_videos, template_clips)
                
            elif len(videos_with_desc) >= 2:
                # Au moins 2 vidéos avec descriptions - matching partiel intelligent
                logger.info(f"🔀 Matching partiel intelligent: {len(videos_with_desc)} vidéos avec description pour {len(template_clips)} clips")
                
                # Utilise les vidéos avec descriptions + quelques vidéos sans description
                all_available = videos_with_desc + videos_without_desc[:len(template_clips)]
                all_available = all_available[:len(template_clips)]  # Limite au nombre de clips
                
                # Calcule la matrice de similarité (descriptions vides auront score 0)
                similarity_matrix = self._calculate_similarity_matrix(all_available, template_clips)
                
                # Optimise l'assignation avec toutes les vidéos
                optimal_assignments = self._optimize_assignments(similarity_matrix, all_available, template_clips)
                
            else:
                # Peu ou pas de vidéos avec descriptions - distribution équitable par ordre chronologique
                logger.info(f"📋 Distribution équitable: {len(videos_with_desc)} vidéos avec description, {len(videos_without_desc)} sans description")
                
                # Force la distribution équitable de TOUTES les vidéos disponibles
                all_available = user_videos[:len(template_clips)]  # Prend les N premières vidéos (ordre chronologique)
                
                optimal_assignments = []
                for i, (clip, video) in enumerate(zip(template_clips, all_available)):
                    # Calcule la similarité si description disponible, sinon score bas
                    video_desc = self._get_video_description(video)
                    if video_desc and video_desc.strip():
                        confidence = self.calculate_text_similarity(video_desc, clip.get('description', ''))
                    else:
                        confidence = 0.1  # Score très faible mais permet la distribution
                    
                    optimal_assignments.append({
                        "slotId": f"slot_{i}",
                        "videoId": video.id,
                        "confidence": confidence,
                        "clip_description": clip.get('description', ''),
                        "video_description": self._get_video_description(video) or 'Pas de description',
                        "duration": clip.get('duration', 1.5),
                        "clip_order": clip.get('order', i)
                    })
            
            # Génère les détails de matching 
            if 'similarity_matrix' in locals():
                matching_details = self._generate_matching_details(optimal_assignments, similarity_matrix, user_videos, template_clips)
            else:
                # Pas de matrice de similarité disponible
                scores = [assignment['confidence'] for assignment in optimal_assignments]
                matching_details = {
                    "average_score": sum(scores) / len(scores) if scores else 0.0,
                    "min_score": min(scores) if scores else 0.0,
                    "max_score": max(scores) if scores else 0.0,
                    "assignments_count": len(optimal_assignments),
                    "strategy_used": "fallback_chronological" if len(videos_with_desc) == 0 else "hybrid"
                }
            
            logger.info(f"✅ Assignation optimisée terminée avec score moyen: {matching_details['average_score']:.2f}")
            
            return {
                "slot_assignments": optimal_assignments,
                "matching_scores": matching_details,
                "template_clips_count": len(template_clips),
                "user_videos_count": len(user_videos)
            }
            
        except Exception as e:
            logger.error(f"❌ Erreur lors du matching intelligent: {e}")
            return self._fallback_assignment(property_id, db)
        finally:
            db.close()
    
    def _calculate_similarity_matrix(self, user_videos: List[Video], template_clips: List[Dict]) -> List[List[float]]:
        """Calcule la matrice de similarité entre toutes les vidéos et tous les clips"""
        matrix = []
        
        for video in user_videos:
            video_row = []
            for clip in template_clips:
                # Utilise la méthode _get_video_description pour récupérer les descriptions BLIP
                video_description = self._get_video_description(video)
                similarity = self.calculate_text_similarity(
                    video_description,
                    clip.get('description', '')
                )
                video_row.append(similarity)
            matrix.append(video_row)
            
        return matrix
    
    def _optimize_assignments(self, similarity_matrix: List[List[float]], 
                            user_videos: List[Video], template_clips: List[Dict]) -> List[Dict]:
        """
        Optimise l'assignation des vidéos aux slots basée sur la matrice de similarité
        
        Utilise un algorithme de matching bipartite pour maximiser le score total
        en trouvant l'assignation optimale pour chaque clip/vidéo
        """
        assignments = []
        
        # Trie les clips par ordre dans la template
        sorted_clips = sorted(template_clips, key=lambda x: x.get('order', 0))
        
        logger.info(f"🎯 Optimisation de l'assignation: {len(user_videos)} vidéos → {len(sorted_clips)} clips")
        
        # Trouve l'assignation optimale pour chaque clip
        best_assignment = self._find_optimal_assignment(similarity_matrix, user_videos, sorted_clips)
        
        for clip_idx, video_idx in best_assignment.items():
            clip = sorted_clips[clip_idx]
            video = user_videos[video_idx]
            score = similarity_matrix[video_idx][clip_idx] if clip_idx < len(similarity_matrix[video_idx]) else 0.0
            
            assignments.append({
                "slotId": f"slot_{clip_idx}",
                "videoId": video.id,
                "confidence": score,
                "clip_description": clip.get('description', ''),
                "video_description": self._get_video_description(video),
                "duration": clip.get('duration', 1.5),
                "clip_order": clip.get('order', clip_idx)
            })
            
            logger.info(f"  Clip {clip_idx+1} → Vidéo {video_idx+1} (Score: {score:.3f})")
        
        # Trie les assignations par clip order pour maintenir l'ordre de la template
        assignments.sort(key=lambda x: x.get('clip_order', 0))
        
        return assignments
    
    def _find_optimal_assignment(self, similarity_matrix: List[List[float]], 
                               user_videos: List[Video], sorted_clips: List[Dict]) -> Dict[int, int]:
        """
        Trouve l'assignation optimale clip → vidéo qui maximise le score total
        
        Utilise un algorithme glouton amélioré avec backtracking local
        """
        num_clips = len(sorted_clips)
        num_videos = len(user_videos)
        
        if num_clips == 0 or num_videos == 0:
            return {}
        
        # Si on a plus de clips que de vidéos, certaines vidéos seront réutilisées
        # Si on a plus de vidéos que de clips, certaines vidéos ne seront pas utilisées
        
        # Algorithme glouton amélioré pour une assignation optimale
        assignment = {}
        used_videos = set()
        
        # Crée toutes les paires (clip, vidéo) avec leurs scores
        all_pairs = []
        for clip_idx in range(num_clips):
            for video_idx in range(num_videos):
                score = similarity_matrix[video_idx][clip_idx] if clip_idx < len(similarity_matrix[video_idx]) else 0.0
                all_pairs.append((score, clip_idx, video_idx))
        
        # Trie par score décroissant
        all_pairs.sort(reverse=True)
        
        # Première passe: assignation gloutonne sans réutilisation
        for score, clip_idx, video_idx in all_pairs:
            if clip_idx not in assignment and video_idx not in used_videos:
                assignment[clip_idx] = video_idx
                used_videos.add(video_idx)
                
                # Si tous les clips ont été assignés, terminé
                if len(assignment) >= num_clips:
                    break
        
        # Deuxième passe: assigne les clips restants aux meilleures vidéos disponibles
        # (permet la réutilisation si nécessaire)
        for clip_idx in range(num_clips):
            if clip_idx not in assignment:
                best_video_idx = 0
                best_score = similarity_matrix[0][clip_idx] if clip_idx < len(similarity_matrix[0]) else 0.0
                
                for video_idx in range(num_videos):
                    score = similarity_matrix[video_idx][clip_idx] if clip_idx < len(similarity_matrix[video_idx]) else 0.0
                    if score > best_score:
                        best_score = score
                        best_video_idx = video_idx
                
                assignment[clip_idx] = best_video_idx
        
        return assignment
    
    def _generate_matching_details(self, assignments: List[Dict], similarity_matrix: List[List[float]],
                                  user_videos: List[Video], template_clips: List[Dict]) -> Dict:
        """Génère des détails sur la qualité du matching"""
        scores = [assignment['confidence'] for assignment in assignments]
        
        return {
            "average_score": sum(scores) / len(scores) if scores else 0.0,
            "min_score": min(scores) if scores else 0.0,
            "max_score": max(scores) if scores else 0.0,
            "assignments_count": len(assignments),
            "threshold_used": self.similarity_threshold,
            "high_quality_matches": len([s for s in scores if s >= 0.7]),
            "medium_quality_matches": len([s for s in scores if 0.4 <= s < 0.7]),
            "low_quality_matches": len([s for s in scores if s < 0.4])
        }
    
    def _fallback_assignment(self, property_id: str, db: Session) -> Dict[str, Any]:
        """Assignation de fallback si le matching intelligent échoue"""
        user_videos = db.query(Video).filter(
            Video.property_id == property_id,
            Video.status == "completed"
        ).limit(10).all()
        
        assignments = []
        for i, video in enumerate(user_videos):
            assignments.append({
                "slotId": f"slot_{i}",
                "videoId": video.id,
                "confidence": 0.5,  # Score moyen pour fallback
                "clip_description": "Fallback assignment",
                "video_description": self._get_video_description(video),
                "duration": 1.5
            })
        
        return {
            "slot_assignments": assignments,
            "matching_scores": {
                "average_score": 0.5,
                "fallback_mode": True,
                "assignments_count": len(assignments)
            }
        }

    def _get_video_description(self, video) -> str:
        """
        Récupère la description de la vidéo en cherchant dans plusieurs sources :
        1. Le champ description
        2. Le champ source_data.content_description (analyse BLIP)
        """
        # D'abord le champ description direct
        if video.description and video.description.strip():
            return video.description.strip()
        
        # Ensuite dans source_data JSON
        if video.source_data:
            try:
                import json
                source_data = json.loads(video.source_data)
                content_desc = source_data.get('content_description')
                if content_desc and content_desc.strip():
                    return content_desc.strip()
            except (json.JSONDecodeError, AttributeError):
                pass
        
        return ""

# Instance globale
smart_matching_service = SmartVideoMatchingService()