"""
Instagram Description Generation Service using OpenAI GPT.
Creates personalized Instagram descriptions based on hotel properties and user video ideas.
"""

import json
import logging
import os
from typing import Dict, Any, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)

class InstagramDescriptionService:
    def __init__(self):
        """Initialize the Instagram description service with OpenAI GPT."""
        self.client: Optional[OpenAI] = None
        
    def _load_client(self):
        """Lazy load the OpenAI client."""
        if self.client is None:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                logger.warning("OPENAI_API_KEY not set, using fallback system")
                self.client = "fallback"
                return
            
            self.client = OpenAI(api_key=api_key)
            logger.info("OpenAI client initialized for Instagram description generation")
    
    def generate_description(self, property_data: Dict[str, Any], user_idea: str, 
                           template_info: Optional[Dict[str, Any]] = None, language: str = "fr", length: str = "moyenne") -> str:
        """
        Generate a personalized Instagram description based on property and user idea.
        
        Args:
            property_data: Property information (name, location, description, etc.)
            user_idea: Original video idea from the user
            template_info: Optional viral template information used
            language: Target language code (fr, en, es, it, de, pt, nl)
            length: Description length (courte, moyenne, longue)
            
        Returns:
            Generated Instagram description with hashtags in the specified language and length
        """
        self._load_client()
        
        # Extract property details
        property_name = property_data.get('name', 'Notre établissement')
        property_location = f"{property_data.get('city', '')}, {property_data.get('country', '')}"
        property_description = property_data.get('description', '')
        property_type = self._determine_property_type(property_data)
        
        # Get language info and length specifications
        language_info = self._get_language_info(language)
        length_specs = self._get_length_specs(length)
        
        # Create contextual prompt
        prompt = f"""Tu es un expert en marketing digital pour l'hôtellerie et les réseaux sociaux. 
Crée une description Instagram engageante et authentique pour cette vidéo EN {language_info['name'].upper()}.

PROPRIÉTÉ:
- Nom: {property_name}
- Lieu: {property_location}
- Type: {property_type}
- Description: {property_description}

IDÉE VIDÉO DE L'UTILISATEUR: "{user_idea}"

{self._get_template_context(template_info)}

INSTRUCTIONS:
- Crée une description Instagram captivante EN {language_info['name'].upper()}
- LONGUEUR: {length_specs['description']}
- IMPÉRATIF: La description finale doit faire MAXIMUM 2200 caractères (espaces inclus)
- Utilise un ton naturel et engageant, pas trop promotionnel
- Inclus 2-3 émojis pertinents mais pas excessif
- Ajoute {length_specs['hashtags']} hashtags stratégiques à la fin (adaptés à la langue {language_info['name']})
- Mentionne le lieu et l'expérience authentique
- Évite les clichés marketing, sois original et personnel
- Adapte le style au type d'établissement et à l'idée vidéo
- RESPECTE PARFAITEMENT LA GRAMMAIRE ET L'ORTHOGRAPHE EN {language_info['name'].upper()}
- CONTRÔLE FINAL: Vérifie que le texte final ne dépasse pas 2200 caractères

EXEMPLE DE STRUCTURE:
[Description authentique de l'expérience]

[2-3 phrases sur ce qui rend ce moment/lieu spécial]

[Call-to-action subtil]

#hashtags #pertinents #lieu #experience

Génère UNIQUEMENT la description finale en {language_info['name']}, sans commentaires."""

        try:
            if isinstance(self.client, OpenAI):
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",  # Most cost-effective model for marketing content
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=300
                )
                
                description = response.choices[0].message.content.strip()
                
                # Ensure description doesn't exceed 2200 characters
                if len(description) > 2200:
                    logger.warning(f"Description too long ({len(description)} chars), truncating...")
                    description = description[:2197] + "..."
                
                logger.info(f"✨ Generated Instagram description for {property_name} ({len(description)} chars)")
                return description
            else:
                # Fallback for when OpenAI is not available
                return self._generate_fallback_description(property_data, user_idea)
                
        except Exception as e:
            logger.error(f"Error generating Instagram description: {e}")
            return self._generate_fallback_description(property_data, user_idea)
    
    def _determine_property_type(self, property_data: Dict[str, Any]) -> str:
        """Determine property type from available data."""
        name = property_data.get('name', '').lower()
        description = property_data.get('description', '').lower()
        
        if any(word in name + description for word in ['hotel', 'hôtel']):
            return 'Hôtel'
        elif any(word in name + description for word in ['villa', 'maison']):
            return 'Villa'
        elif any(word in name + description for word in ['resort', 'spa']):
            return 'Resort'
        elif any(word in name + description for word in ['auberge', 'gîte']):
            return 'Auberge'
        else:
            return 'Établissement'
    
    def _get_template_context(self, template_info: Optional[Dict[str, Any]]) -> str:
        """Get template context information for better description generation."""
        if not template_info:
            return ""
        
        return f"""
TEMPLATE VIRAL UTILISÉ:
- Titre: {template_info.get('title', '')}
- Hôtel original: {template_info.get('hotel_name', '')}
- Style: {template_info.get('property', '')}
(Inspire-toi du style viral mais adapte au contexte de notre propriété)
"""
    
    def _generate_fallback_description(self, property_data: Dict[str, Any], user_idea: str) -> str:
        """Generate a basic description when AI is not available."""
        property_name = property_data.get('name', 'Notre établissement')
        location = f"{property_data.get('city', '')}, {property_data.get('country', '')}"
        
        # Basic template based on user idea keywords
        if any(word in user_idea.lower() for word in ['petit', 'déjeuner', 'breakfast']):
            base_text = f"Commencez votre journée parfaite au {property_name} ☀️\n\nNotre petit-déjeuner vous attend avec des saveurs authentiques et une vue imprenable. Chaque matin est une nouvelle découverte dans notre coin de paradis à {location}.\n\nRéservez votre escapade dès maintenant !"
            hashtags = "#petitdejeuner #hotel #france #authentic #breakfast #travel #vacation #luxury #morning #experience #booking #paradise"
        elif any(word in user_idea.lower() for word in ['piscine', 'pool', 'spa']):
            base_text = f"Détente absolue au {property_name} 🏊‍♀️\n\nPlongez dans notre oasis de tranquillité à {location}. Moments de pure relaxation et souvenirs inoubliables vous attendent dans ce cadre d'exception.\n\nVenez vivre l'expérience !"
            hashtags = "#spa #detente #piscine #relaxation #hotel #wellness #travel #luxury #paradise #booking #vacation #peace"
        else:
            base_text = f"Découvrez la magie du {property_name} ✨\n\nUne expérience authentique vous attend à {location}. Chaque instant devient un souvenir précieux dans notre établissement d'exception.\n\nRéservez votre séjour inoubliable !"
            hashtags = "#hotel #travel #france #luxury #authentic #vacation #booking #experience #paradise #amazing #destination #unforgettable"
        
        return f"{base_text}\n\n{hashtags}"
    
    def _get_language_info(self, language_code: str) -> Dict[str, str]:
        """Get language information from language code."""
        languages = {
            'fr': {'name': 'français', 'native': 'Français'},
            'en': {'name': 'anglais', 'native': 'English'},
            'es': {'name': 'espagnol', 'native': 'Español'},
            'it': {'name': 'italien', 'native': 'Italiano'},
            'de': {'name': 'allemand', 'native': 'Deutsch'},
            'pt': {'name': 'portugais', 'native': 'Português'},
            'nl': {'name': 'néerlandais', 'native': 'Nederlands'}
        }
        return languages.get(language_code, languages['fr'])
    
    def _get_length_specs(self, length: str) -> Dict[str, str]:
        """Get length specifications for different description lengths."""
        length_specs = {
            'courte': {
                'description': 'UNE SEULE PHRASE engageante et impactante',
                'hashtags': '5-8'
            },
            'moyenne': {
                'description': 'Un petit paragraphe de 2-4 phrases',
                'hashtags': '8-12'
            },
            'longue': {
                'description': 'Plusieurs paragraphes détaillés (3-5 paragraphes)',
                'hashtags': '12-20'
            }
        }
        return length_specs.get(length, length_specs['moyenne'])
    
    def translate_description(self, current_description: str, target_language: str, length: str = "moyenne") -> str:
        """
        Translate an existing Instagram description to a target language.
        
        Args:
            current_description: Existing description to translate
            target_language: Target language code (fr, en, es, it, de, pt, nl)
            length: Target description length (courte, moyenne, longue)
            
        Returns:
            Translated description with specified length
        """
        self._load_client()
        
        language_info = self._get_language_info(target_language)
        length_specs = self._get_length_specs(length)
        
        prompt = f"""Tu es un traducteur professionnel spécialisé dans le marketing digital pour l'hôtellerie.

TÂCHE: Traduis cette description Instagram EN {language_info['name'].upper()} en conservant parfaitement:
- Le ton marketing engageant
- Les émojis appropriés
- L'authenticité du message
- Les hashtags adaptés à la langue cible

DESCRIPTION ORIGINALE:
{current_description}

INSTRUCTIONS:
- Traduis en {language_info['name']} naturel et authentique
- LONGUEUR: {length_specs['description']}
- IMPÉRATIF: La traduction finale doit faire MAXIMUM 2200 caractères (espaces inclus)
- Conserve le même style marketing engageant
- Adapte les hashtags à la langue {language_info['name']} ({length_specs['hashtags']} hashtags)
- Garde les émojis pertinents
- RESPECTE PARFAITEMENT LA GRAMMAIRE EN {language_info['name'].upper()}
- CONTRÔLE FINAL: Vérifie que le texte final ne dépasse pas 2200 caractères

Génère UNIQUEMENT la traduction finale en {language_info['name']}, sans commentaires."""

        try:
            if isinstance(self.client, OpenAI):
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,  # Lower temperature for more consistent translations
                    max_tokens=300
                )
                
                translated_description = response.choices[0].message.content.strip()
                
                # Ensure translated description doesn't exceed 2200 characters
                if len(translated_description) > 2200:
                    logger.warning(f"Translation too long ({len(translated_description)} chars), truncating...")
                    translated_description = translated_description[:2197] + "..."
                
                logger.info(f"✨ Translated description to {language_info['name']} ({len(translated_description)} chars)")
                return translated_description
            else:
                # Fallback for when OpenAI is not available
                return f"[Traduction en {language_info['native']}] {current_description}"
                
        except Exception as e:
            logger.error(f"Error translating description: {e}")
            return f"[Traduction en {language_info['native']}] {current_description}"

# Global instance
instagram_service = InstagramDescriptionService()