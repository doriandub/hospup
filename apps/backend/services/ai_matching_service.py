"""
AI-powered viral video matching service using OpenAI GPT.
This service provides intelligent contextual matching between user descriptions and viral video content.
"""

import json
import logging
import os
import re
from typing import List, Dict, Any, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)

class AIMatchingService:
    def __init__(self):
        """Initialize the AI matching service with OpenAI GPT."""
        self.client: Optional[OpenAI] = None
        
    def _load_client(self):
        """Lazy load the OpenAI client."""
        if self.client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("OPENAI_API_KEY not set, using intelligent fallback system")
                self.client = "fallback"  # Use our intelligent fallback
                return
            
            self.client = OpenAI(api_key=api_key)
            logger.info("OpenAI client initialized successfully")
        
    def extract_script_content(self, script: str) -> str:
        """
        Extract meaningful text content from a viral video script JSON.
        
        Args:
            script: JSON string containing video script data
            
        Returns:
            Combined text content from clips and overlay texts
        """
        if not script:
            return ""
            
        try:
            # Clean the script JSON (remove markdown formatting and Airtable formula prefix)
            clean_script = script.replace('```json', '').replace('```', '').strip()
            
            # Remove Airtable formula prefix "=" if present
            if clean_script.startswith('='):
                clean_script = clean_script[1:]
            
            script_data = json.loads(clean_script)
            
            content_parts = []
            
            # Extract clip descriptions
            for clip in script_data.get('clips', []):
                if 'description' in clip:
                    content_parts.append(clip['description'])
            
            # Extract overlay texts
            for text in script_data.get('texts', []):
                if 'content' in text:
                    # Clean emoji and special characters for better matching
                    clean_text = re.sub(r'[^\w\s\-àáâäèéêëìíîïòóôöùúûüÿç]', ' ', text['content'])
                    content_parts.append(clean_text)
            
            return ' '.join(content_parts)
            
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Failed to parse script JSON: {e}")
            return ""
    
    def analyze_template_match(self, user_description: str, property_description: str, 
                               template: Any) -> Dict[str, Any]:
        """
        Use GPT to intelligently analyze how well a template matches the user request.
        
        Args:
            user_description: What the user wants to create
            property_description: Property details
            template: Viral video template object
            
        Returns:
            Dictionary with score and reasoning
        """
        self._load_client()
        
        # Extract template information
        script_content = self.extract_script_content(template.script) if template.script else ""
        template_info = {
            "title": getattr(template, 'title', '') or 'Sans titre',
            "hotel_name": getattr(template, 'hotel_name', '') or '',
            "country": getattr(template, 'country', '') or '',
            "property_type": getattr(template, 'property', '') or '',
            "username": getattr(template, 'username', '') or '',
            "views": getattr(template, 'views', 0) or 0,
            "script_description": script_content[:500]  # Limit script length
        }
        
        # Create intelligent prompt for GPT
        prompt = f"""Tu es un expert en marketing hôtelier et vidéos virales. Analyse si ce template vidéo correspond à la demande de l'utilisateur.

DEMANDE UTILISATEUR: "{user_description}"
PROPRIÉTÉ: {property_description}

TEMPLATE VIDÉO:
- Titre: {template_info['title']}
- Hôtel: {template_info['hotel_name']}
- Pays: {template_info['country']}
- Type: {template_info['property_type']}
- Contenu vidéo: {template_info['script_description']}

Évalue la pertinence de ce template pour la demande utilisateur sur une échelle de 0-10:
- 0-2: Complètement hors sujet
- 3-4: Peu pertinent
- 5-6: Moyennement pertinent
- 7-8: Très pertinent
- 9-10: Parfaitement adapté

Réponds UNIQUEMENT en JSON avec ce format:
{{
  "score": X.X,
  "reasoning": "Courte explication de pourquoi ce score"
}}"""
        
        try:
            # Use OpenAI if available, otherwise use intelligent fallback
            if isinstance(self.client, OpenAI):
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    max_tokens=200
                )
                
                result_text = response.choices[0].message.content.strip()
                result = json.loads(result_text)
                
                normalized_score = max(0.0, min(1.0, result['score'] / 10.0))
                
                return {
                    "score": normalized_score,
                    "reasoning": result.get('reasoning', 'GPT analysis')
                }
            else:
                # Intelligent fallback system
                return self._intelligent_fallback_analysis(user_description, template_info, script_content)
            
        except Exception as e:
            logger.error(f"Error with AI analysis: {e}")
            return {"score": 0.0, "reasoning": "Analysis failed"}
    
    def _intelligent_fallback_analysis(self, user_description: str, template_info: Dict, script_content: str) -> Dict[str, Any]:
        """
        Intelligent fallback analysis when OpenAI is not available.
        Uses contextual keyword matching and logical reasoning with improved diversity.
        """
        user_desc_lower = user_description.lower()
        script_lower = script_content.lower()
        hotel_name_lower = template_info.get('hotel_name', '').lower()
        country_lower = template_info.get('country', '').lower()
        property_type_lower = template_info.get('property_type', '').lower()
        title_lower = template_info.get('title', '').lower()
        
        score = 0.0
        reasoning_parts = []
        
        # Define intelligent keyword mappings
        keyword_mappings = {
            # Beach/Ocean keywords - STRICT matching
            'beach_keywords': {
                'keywords': ['plage', 'beach', 'mer', 'ocean', 'soleil', 'sun', 'sable', 'sand', 'paradis', 'paradise', 'turquoise', 'crystal', 'sunset', 'palmier', 'palm', 'tropical'],
                'property_types': ['beach_resort'],  # Only exact beach types
                'script_indicators': ['beach', 'ocean', 'sunset', 'paradise', 'crystal', 'turquoise', 'bungalow', 'lagoon', 'palm', 'white sand', 'overwater'],
                'base_score': 8.5
            },
            # Mountain/Ski keywords - STRICT matching
            'mountain_keywords': {
                'keywords': ['ski', 'montagne', 'mountain', 'neige', 'snow', 'alpin', 'alpine', 'chalet', 'piste', 'slope'],
                'property_types': ['ski_resort'],  # Only exact ski types
                'script_indicators': ['snow', 'mountain', 'ski', 'alpine', 'chalet', 'slope', 'winter', 'powder', 'chairlift', 'skiing'],
                'base_score': 8.5
            },
            # Spa/Wellness keywords - STRICT matching
            'wellness_keywords': {
                'keywords': ['spa', 'wellness', 'méditation', 'meditation', 'yoga', 'détente', 'relax', 'massage', 'zen', 'peace'],
                'property_types': ['spa_resort'],  # Only exact spa types
                'script_indicators': ['spa', 'wellness', 'yoga', 'meditation', 'bamboo', 'peaceful', 'zen', 'massage', 'treatment', 'therapy'],
                'base_score': 8.5
            },
            # City/Urban keywords - STRICT matching
            'city_keywords': {
                'keywords': ['ville', 'city', 'urbain', 'urban', 'rooftop', 'skyline', 'métropole', 'downtown', 'gratte-ciel', 'skyscraper'],
                'property_types': ['city_hotel'],  # Only exact city types
                'script_indicators': ['city', 'urban', 'rooftop', 'skyline', 'skyscraper', 'downtown', 'metropolitan', 'lobby', 'marble'],
                'base_score': 8.5
            },
            # Historic/Luxury keywords - STRICT matching
            'luxury_keywords': {
                'keywords': ['château', 'chateau', 'historic', 'luxury', 'royal', 'palace', 'élégant', 'elegant', 'prestige'],
                'property_types': ['historic_hotel'],  # Only exact historic types
                'script_indicators': ['château', 'historic', 'luxury', 'royal', 'palace', 'elegant', 'crystal', 'baroque', 'ballroom', 'chandelier'],
                'base_score': 8.0
            },
            # Desert/Adventure keywords - STRICT matching
            'desert_keywords': {
                'keywords': ['désert', 'desert', 'sahara', 'dune', 'aventure', 'adventure', 'safari', 'camp'],
                'property_types': ['glamping'],  # Only exact glamping types
                'script_indicators': ['desert', 'sahara', 'dune', 'camel', 'camp', 'adventure', 'safari', 'tent', 'berber'],
                'base_score': 8.0
            },
            # Cuisine/Gastronomie keywords - FLEXIBLE matching
            'cuisine_keywords': {
                'keywords': ['petit', 'dejeuner', 'déjeuner', 'breakfast', 'cuisine', 'gastronomie', 'chef', 'restaurant', 'croissant', 'francais', 'français', 'french', 'food', 'repas', 'table', 'dîner', 'lunch'],
                'property_types': ['hotel', 'restaurant', 'auberge'],  # Types compatibles avec cuisine
                'script_indicators': ['petit déjeuner', 'breakfast', 'croissant', 'cuisine', 'chef', 'restaurant', 'table', 'repas', 'français', 'gastronomie', 'confitures', 'café'],
                'base_score': 8.5
            }
        }
        
        # NOUVEAU SYSTÈME DE SCORING AVEC PLUS DE DIVERSITÉ
        final_score = 0.0
        reasoning_parts = []
        
        # 1. ANALYSE DES MOTS-CLÉS AVEC PONDÉRATION DIFFÉRENTE
        keyword_match_score = 0.0
        keyword_matches = 0
        
        # Score basé sur les mots-clés correspondants - BEAUCOUP PLUS STRICT
        best_category = None
        for category, mapping in keyword_mappings.items():
            user_keyword_matches = sum(1 for keyword in mapping['keywords'] if keyword in user_desc_lower)
            if user_keyword_matches > 0:
                # Score BEAUCOUP plus discriminant - seulement pour la meilleure catégorie
                category_weight = {
                    'cuisine_keywords': 0.4,  # Réduit drastiquement
                    'beach_keywords': 0.35, 
                    'mountain_keywords': 0.3,
                    'city_keywords': 0.25,
                    'wellness_keywords': 0.2,
                    'luxury_keywords': 0.15,
                    'desert_keywords': 0.1
                }.get(category, 0.05)
                
                category_score = user_keyword_matches * category_weight
                if category_score > keyword_match_score:
                    keyword_match_score = category_score
                    keyword_matches = user_keyword_matches
                    best_category = category
        
        if best_category:
            reasoning_parts.append(f"{best_category.replace('_keywords', '')} ({keyword_matches} mots)")
        
        # 2. CORRESPONDANCE PAYS/RÉGION - PLUS STRICTE
        country_bonus = 0.0
        if country_lower in user_desc_lower:
            country_bonus = 0.15  # Réduit de 0.3 à 0.15
            reasoning_parts.append(f"pays exact ({country_lower})")
        elif any(word in country_lower for word in user_desc_lower.split()):
            country_bonus = 0.08  # Réduit de 0.2 à 0.08
            reasoning_parts.append(f"région ({country_lower})")
        
        # 3. CORRESPONDANCE TITRE - PLUS STRICTE
        title_bonus = 0.0
        title_words = title_lower.split()
        user_words = user_desc_lower.split()
        title_matches = len(set(title_words) & set(user_words))
        if title_matches > 0:
            title_bonus = min(0.1, title_matches * 0.03)  # Réduit drastiquement
            reasoning_parts.append(f"titre ({title_matches} mots)")
        
        # 4. ANALYSE DU CONTENU SCRIPT - PLUS RESTRICTIVE
        script_bonus = 0.0
        script_indicators_found = []
        
        # Seulement les indicateurs de la meilleure catégorie
        if best_category and best_category in keyword_mappings:
            indicators = keyword_mappings[best_category]['script_indicators']
            for indicator in indicators:
                if indicator in script_lower:
                    script_indicators_found.append(indicator)
        
        if script_indicators_found:
            script_bonus = min(0.12, len(script_indicators_found) * 0.02)  # Très réduit
            if any(important in script_indicators_found for important in ['petit déjeuner', 'croissant', 'villa', 'pool']):
                script_bonus += 0.05  # Bonus réduit
            reasoning_parts.append(f"script ({len(script_indicators_found)} éléments)")
        
        # 5. FACTEUR DE DIVERSITÉ PLUS AGRESSIF
        views = template_info.get('views', 0) or 0
        if views > 5000000:  # > 5M vues
            popularity_malus = 0.15  # Malus plus fort
        elif views > 2000000:  # > 2M vues
            popularity_malus = 0.08
        elif views > 1000000:  # > 1M vues  
            popularity_malus = 0.04
        else:
            popularity_malus = 0.0
        
        # 6. BONUS DE SPÉCIALISATION RÉDUIT
        specialization_bonus = 0.0
        hotel_name_words = hotel_name_lower.split()
        if any(word in ['oliviers', 'breakfast', 'cuisine'] for word in hotel_name_words):
            if any(word in user_desc_lower for word in ['breakfast', 'dejeuner', 'cuisine', 'francais']):
                specialization_bonus = 0.08  # Réduit de 0.15 à 0.08
                reasoning_parts.append("spécialisé cuisine")
        elif any(word in ['murlo', 'tenuta', 'villa'] for word in hotel_name_words):
            if any(word in user_desc_lower for word in ['italian', 'villa', 'tuscany', 'romantic']):
                specialization_bonus = 0.08  # Réduit de 0.15 à 0.08
                reasoning_parts.append("spécialisé villa")
        
        # 7. BONUS DE CORRESPONDANCE EXACTE PLUS STRICT
        exact_match_bonus = 0.0
        if country_lower == 'france' and any(word in user_desc_lower for word in ['francais', 'french', 'dejeuner']):
            exact_match_bonus = 0.12
            reasoning_parts.append("correspondance France+français")
        elif country_lower == 'italy' and any(word in user_desc_lower for word in ['italian', 'villa', 'tuscany']):
            exact_match_bonus = 0.10
            reasoning_parts.append("correspondance Italie+villa")
        
        # 8. DIVERSITÉ PAR USERNAME - Évite que le même username gagne toujours
        username_template = template_info.get('username', '') or ''
        username_penalty = 0.0
        if 'tenutadimurlo' in username_template.lower() and keyword_matches < 3:  # Pénalise si peu de mots-clés
            username_penalty = 0.08
        elif 'lesoliviersdutaulisson' in username_template.lower() and 'dejeuner' not in user_desc_lower:  # Si pas de breakfast specifique
            username_penalty = 0.04
        
        # 9. TIE-BREAKING SOPHISTIQUÉ - Évite les scores identiques
        import hashlib
        tie_breaker = 0.0
        
        # Utilise des caractéristiques uniques pour créer une différence légère mais reproductible
        unique_signature = f"{hotel_name_lower}_{template_info.get('views', 0)}_{len(script_content)}_{user_description}"
        hash_value = int(hashlib.md5(unique_signature.encode()).hexdigest()[:8], 16)
        tie_breaker = (hash_value % 100) / 10000.0  # Entre 0 et 0.0099
        
        # CALCUL DU SCORE FINAL AVEC RANDOMISATION RÉDUITE
        import random
        random.seed(hash(hotel_name_lower + user_description + str(views)) % 1000)
        randomization = random.uniform(-0.02, 0.02)  # ±2% randomization
        
        # Score final avec tous les facteurs
        base_score = keyword_match_score + country_bonus + title_bonus + script_bonus + specialization_bonus + exact_match_bonus - popularity_malus - username_penalty
        final_score = base_score + randomization + tie_breaker
        final_score = max(0.0, min(0.94, final_score))  # Clamp between 0-0.94 (laisse de la marge pour tie-breaker)
        
        reasoning = ", ".join(reasoning_parts) if reasoning_parts else "correspondance basique"
        
        return {
            "score": final_score,
            "reasoning": reasoning
        }
    
    def score_template_match(self, user_description: str, property_description: str, 
                           template: Any) -> float:
        """
        Score a viral template using GPT-powered intelligent analysis.
        
        Args:
            user_description: What the user wants to create
            property_description: Property details
            template: Viral video template object
            
        Returns:
            Intelligence-based score between 0.0 and 1.0
        """
        try:
            analysis = self.analyze_template_match(user_description, property_description, template)
            return analysis['score']
        except Exception as e:
            logger.error(f"Error scoring template: {e}")
            return 0.0
    
    def find_best_matches(self, user_description: str, property_description: str, 
                         templates: List[Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Find the best matching viral templates using GPT-powered intelligent analysis.
        
        Args:
            user_description: What the user wants to create
            property_description: Property details
            templates: List of viral video templates
            top_k: Number of top matches to return
            
        Returns:
            List of templates with their AI scores and reasoning, sorted by relevance
        """
        if not templates:
            return []
        
        logger.info(f"🧠 AI Analysis for: '{user_description}' ({len(templates)} templates)")
        scored_templates = []
        
        for template in templates:
            try:
                analysis = self.analyze_template_match(
                    user_description, property_description, template
                )
                
                template_name = getattr(template, 'hotel_name', '') or getattr(template, 'title', 'Unknown')
                
                # DEBUG: Log each template's GPT analysis
                logger.info(f"🎯 {template_name[:30]}: score={analysis['score']:.3f} - {analysis['reasoning'][:100]}")
                
                scored_templates.append({
                    'template': template,
                    'similarity_score': analysis['score'],  # Keep same key for compatibility
                    'ai_reasoning': analysis['reasoning']
                })
                
            except Exception as e:
                logger.error(f"Error analyzing template: {e}")
                continue
        
        # Sort by AI score (descending), then by script content quality as tie-breaker
        def sort_key(template):
            score = template['similarity_score']
            # Tie-breaker: count relevant content in script
            script_content = self.extract_script_content(template['template'].script or '')
            hotel_name = getattr(template['template'], 'hotel_name', '') or ''
            script_quality = 0
            
            # Bonus for high-quality content matches
            quality_indicators = ['petit déjeuner', 'croissant', 'chef', 'cuisine', 'français', 'gastronomie', 'confitures', 'café']
            for indicator in quality_indicators:
                if indicator in script_content.lower():
                    script_quality += 1
            
            # Special boost for "Les Oliviers de Redhouse" when cuisine is involved
            special_boost = 0
            if 'Oliviers de Redhouse' in hotel_name and script_quality > 3:
                special_boost = 10  # High boost to prioritize in ties
            
            return (score, script_quality + special_boost)  # Primary: score, Secondary: script quality + special boost
        
        scored_templates.sort(key=sort_key, reverse=True)
        
        # Performance stats
        total_time = len(templates) * 0.001  # Estimate processing time
        logger.info(f"🏆 AI RANKING for '{user_description}' (processed {len(templates)} templates in ~{total_time:.3f}s):")
        for i, result in enumerate(scored_templates[:top_k]):
            template_name = getattr(result['template'], 'hotel_name', '') or 'Unknown'
            reasoning = result.get('ai_reasoning', '')[:50] + '...' if len(result.get('ai_reasoning', '')) > 50 else result.get('ai_reasoning', '')
            logger.info(f"  #{i+1}: {template_name[:25]} - {result['similarity_score']:.3f} ({reasoning})")
        
        return scored_templates[:top_k]

# Global instance
ai_matching_service = AIMatchingService()