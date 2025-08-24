"""
Groq AI service for text generation
"""
import logging
import os
from typing import Optional
from groq import Groq

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Groq service
        
        Args:
            api_key: Groq API key. If None, will try to use environment variable
        """
        # Get API key from environment or parameter
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        
        if not self.api_key:
            logger.warning("⚠️ No Groq API key configured - using fallback descriptions")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=self.api_key)
                logger.info("✅ Groq service initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Groq: {e}")
                self.client = None
        
        # Initialize prompt templates
        self.prompt_templates = self._get_prompt_templates()

    def generate_instagram_description(
        self, 
        property_obj, 
        user_description: str = "",
        prompt_template: str = "default"
    ) -> str:
        """
        Generate Instagram description for hotel video using complete property info
        
        Args:
            property_obj: Property object with all details (name, description, city, etc.)
            user_description: Original user description/intent for this specific video
            prompt_template: Template to use for description generation (default, luxury, trendy, etc.)
            
        Returns:
            Generated Instagram description
        """
        if not self.client:
            return self._generate_fallback_description(property_obj.name, property_obj.city, property_obj.country, property_obj)
        
        try:
            # Create prompt for Instagram description using selected template
            prompt = self._create_comprehensive_prompt(property_obj, user_description, prompt_template)
            
            # Call Groq API
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.1-8b-instant",  # Fast and free model
                temperature=0.7,
                max_tokens=150,
            )
            
            description = chat_completion.choices[0].message.content.strip()
            logger.info(f"🤖 Generated Groq description for {property_obj.name}")
            return description
            
        except Exception as e:
            logger.error(f"❌ Groq API error: {e}")
            return self._generate_fallback_description(property_obj.name, property_obj.city, property_obj.country, property_obj)
    
    def _create_comprehensive_prompt(self, property_obj, user_description: str, template_name: str = "default") -> str:
        """Create comprehensive prompt using ALL property information and selected template"""
        
        # Extract all available property information
        property_info = f"""INFORMATIONS COMPLÈTES DE L'ÉTABLISSEMENT:
- Nom: {property_obj.name}
- Ville: {property_obj.city or 'Non spécifié'}
- Pays: {property_obj.country or 'France'}
- Type d'établissement: {property_obj.property_type or 'Hotel'}"""

        # Add property description if available
        if property_obj.description:
            property_info += f"\n- Description de l'établissement: {property_obj.description}"
        
        # Add address if available
        if property_obj.address:
            property_info += f"\n- Adresse: {property_obj.address}"
        
        # Add contact info if available
        if property_obj.website_url:
            property_info += f"\n- Site web: {property_obj.website_url}"
        
        if property_obj.phone:
            property_info += f"\n- Téléphone: {property_obj.phone}"
        
        if property_obj.instagram_handle:
            property_info += f"\n- Instagram: {property_obj.instagram_handle}"

        # Add user's specific video message/intent
        video_intent = ""
        if user_description:
            video_intent = f"\n\nMESSAGE SPÉCIFIQUE DE LA VIDÉO:\n- Ce que l'utilisateur veut transmettre: {user_description}"

        # Get the selected template
        template = self.prompt_templates.get(template_name, self.prompt_templates["default"])
        
        # Replace placeholders in the template
        city_tag = f"#{property_obj.city.lower().replace(' ', '').replace('-', '')}" if property_obj.city else "#voyage"
        
        prompt = template.format(
            property_info=property_info,
            video_intent=video_intent,
            city_tag=city_tag,
            city=property_obj.city or "Unknown",
            country=property_obj.country or "France"
        )

        return prompt
    
    def _create_prompt(self, property_name: str, city: str, country: str, user_description: str) -> str:
        """Legacy prompt method - kept for compatibility"""
        
        base_prompt = f"""Génère une description Instagram engageante en français pour cette vidéo d'hôtel.

Informations:
- Nom de l'établissement: {property_name}
- Ville: {city}
- Pays: {country}"""

        if user_description:
            base_prompt += f"\n- Description originale: {user_description}"

        base_prompt += f"""

Instructions:
- Crée une description accrocheuse de 2-3 phrases
- Inclus des hashtags pertinents (#hotel, #travel, #{city.lower().replace(' ', '').replace('-', '') if city else 'voyage'})
- Ton enthousiaste et inspirant
- Maximum 150 caractères
- Ne pas mentionner de prix
- Utilise des emojis appropriés

Exemple de format:
✨ [Description inspirante] 
📍 {city}, {country}
#travel #hotel #{city.lower().replace(' ', '').replace('-', '') if city else 'voyage'}

Génère uniquement la description, sans commentaires supplémentaires:"""

        return base_prompt
    
    def _generate_fallback_description(self, property_name: str, city: str, country: str, property_obj=None) -> str:
        """Generate intelligent fallback description using property data when Groq is not available"""
        
        # If we have the full property object, use more detailed fallback
        if property_obj:
            return self._generate_smart_fallback(property_obj)
        
        # Basic fallback
        city_tag = f"#{city.lower().replace(' ', '').replace('-', '')}" if city else "#voyage"
        country_tag = f"#{country.lower().replace(' ', '').replace('-', '')}" if country else ""
        
        fallback = f"✨ Découvrez {property_name} ! Un séjour d'exception vous attend\n"
        fallback += f"📍 {city}, {country}\n" 
        fallback += f"#travel #hotel #luxury {city_tag} {country_tag} #vacation #hospitality"
        
        logger.info(f"🔄 Used basic fallback description for {property_name}")
        return fallback
    
    def _generate_smart_fallback(self, property_obj) -> str:
        """Generate intelligent fallback using all property information"""
        
        # Base description with property type adaptation
        if property_obj.property_type and 'charme' in property_obj.property_type.lower():
            base_text = f"✨ {property_obj.name}, votre refuge de charme"
        elif property_obj.property_type and 'chateau' in property_obj.property_type.lower():
            base_text = f"🏰 {property_obj.name}, majestueux château-hôtel"
        elif property_obj.property_type and 'spa' in property_obj.property_type.lower():
            base_text = f"🧘‍♀️ {property_obj.name}, votre oasis bien-être"
        else:
            base_text = f"✨ Découvrez {property_obj.name}"
        
        # Add context from description if available
        if property_obj.description:
            if 'mer' in property_obj.description.lower() or 'océan' in property_obj.description.lower():
                base_text += " face à la mer 🌊"
            elif 'montagne' in property_obj.description.lower():
                base_text += " en montagne 🏔️"
            elif 'gastronomique' in property_obj.description.lower():
                base_text += " et sa table gastronomique 🍽️"
            elif 'spa' in property_obj.description.lower():
                base_text += " avec spa 🧘‍♀️"
        
        # Location
        location = f"📍 {property_obj.city}, {property_obj.country}\n"
        
        # Smart hashtags based on city and property type
        city_tag = f"#{property_obj.city.lower().replace(' ', '').replace('-', '')}" if property_obj.city else "#france"
        
        # Type-specific hashtags
        if property_obj.property_type:
            if 'charme' in property_obj.property_type.lower():
                type_tags = "#charme #boutique"
            elif 'chateau' in property_obj.property_type.lower():
                type_tags = "#chateau #luxury #heritage"
            elif 'spa' in property_obj.property_type.lower():
                type_tags = "#spa #wellness #detente"
            else:
                type_tags = "#luxury"
        else:
            type_tags = "#luxury"
        
        hashtags = f"#travel #hotel {type_tags} {city_tag} #vacation #hospitality"
        
        smart_fallback = f"{base_text}\n{location}{hashtags}"
        
        logger.info(f"🧠 Used smart fallback description for {property_obj.name}")
        return smart_fallback
    
    def _get_prompt_templates(self) -> dict:
        """Define different prompt templates for various styles"""
        
        return {
            "default": """Tu es un expert en marketing hôtelier et en création de contenu Instagram. Génère une description Instagram engageante en français pour une vidéo promotionnelle.

{property_info}{video_intent}

INSTRUCTIONS:
- Utilise TOUTES les informations de l'établissement pour créer une description personnalisée et authentique
- Intègre le message spécifique que l'utilisateur veut transmettre dans cette vidéo
- Crée une description accrocheuse de 2-3 phrases maximum
- Utilise un ton enthousiaste et inspirant
- Inclus des emojis pertinents
- Maximum 150 caractères
- Ne mentionne jamais de prix
- Inclus des hashtags pertinents: #hotel #travel {city_tag}

FORMAT ATTENDU:
✨ [Description personnalisée basée sur l'établissement et le message] 
📍 {city}, {country}
#hashtags

Génère uniquement la description finale, sans commentaires:""",

            "luxury": """Tu es un expert en marketing hôtelier spécialisé dans le luxe. Génère une description Instagram sophistiquée et élégante pour une vidéo promotionnelle d'un établissement de prestige.

{property_info}{video_intent}

INSTRUCTIONS:
- Emphasise l'excellence, le raffinement et l'exclusivité
- Utilise un vocabulaire sophistiqué et premium
- Mets en avant l'expérience unique et les services haut de gamme
- Ton élégant et inspirant, sans être ostentatoire
- Inclus des emojis premium (💎, ✨, 🥂, 👑)
- Maximum 150 caractères
- Hashtags luxe: #luxury #prestige #excellence #sophistication {city_tag}

FORMAT ATTENDU:
💎 [Description raffinée mettant en avant l'exclusivité]
📍 {city}, {country}
#luxury #prestige {city_tag}

Génère uniquement la description finale, sans commentaires:""",

            "trendy": """Tu es un influenceur expert en tendances et destinations branchées. Génère une description Instagram moderne et captivante pour une vidéo d'hôtel tendance.

{property_info}{video_intent}

INSTRUCTIONS:
- Utilise un langage moderne, dynamique et accrocheur
- Mets l'accent sur l'aspect photogénique et Instagram-worthy
- Créé un sentiment d'urgence et d'exclusivité ("must-visit", "incontournable")
- Ton enjoué et énergique
- Utilise des emojis tendance (🔥, 💫, ⚡, 🎯, 📸)
- Maximum 150 caractères
- Hashtags branchés: #instaworthy #trendy #mustsee #vibes {city_tag}

FORMAT ATTENDU:
🔥 [Description accrocheuse et moderne]
📍 {city}, {country}
#vibes #instaworthy {city_tag}

Génère uniquement la description finale, sans commentaires:""",

            "family": """Tu es un expert en marketing familial et vacances en famille. Génère une description Instagram chaleureuse pour une vidéo d'établissement family-friendly.

{property_info}{video_intent}

INSTRUCTIONS:
- Mets l'accent sur l'accueil familial, la convivialité et les souvenirs
- Emphasise les activités et services pour tous les âges
- Utilise un ton chaleureux et bienveillant
- Évoque la création de souvenirs inoubliables en famille
- Inclus des emojis familiaux (👨‍👩‍👧‍👦, 🎉, ❤️, 🏖️, 🎈)
- Maximum 150 caractères
- Hashtags famille: #family #familytime #memories #kids {city_tag}

FORMAT ATTENDU:
❤️ [Description chaleureuse axée famille]
📍 {city}, {country}
#family #memories {city_tag}

Génère uniquement la description finale, sans commentaires:""",

            "romantic": """Tu es un expert en escapades romantiques et lunes de miel. Génère une description Instagram romantique et enchanteur pour une vidéo d'établissement couple.

{property_info}{video_intent}

INSTRUCTIONS:
- Créé une atmosphère romantique et intime
- Mets l'accent sur les moments à deux, la complicité et l'amour
- Utilise un vocabulaire tendre et évocateur
- Évoque l'évasion romantique et les moments magiques
- Inclus des emojis romantiques (💕, 🌹, 🥂, 🌅, 💑)
- Maximum 150 caractères
- Hashtags romantiques: #romantic #couple #love #honeymoon {city_tag}

FORMAT ATTENDU:
💕 [Description romantique et évocatrice]
📍 {city}, {country}
#romantic #love {city_tag}

Génère uniquement la description finale, sans commentaires:"""
        }
    
    def get_available_templates(self) -> list:
        """Return list of available prompt templates"""
        return list(self.prompt_templates.keys())

# Global instance
groq_service = GroqService()