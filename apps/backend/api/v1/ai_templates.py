"""
AI Templates API - Gestion des templates de prompts pour l'IA
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging

from core.database import get_db
from core.auth import get_current_user
from models.user import User
from services.groq_service import groq_service

logger = logging.getLogger(__name__)

router = APIRouter()

class TemplateInfo(BaseModel):
    name: str
    description: str
    example_output: str

class GeneratePreviewRequest(BaseModel):
    template_name: str
    property_name: str
    city: str
    country: str
    user_description: str = ""

class GeneratePreviewResponse(BaseModel):
    template_name: str
    description: str
    preview_mode: bool = True

@router.get("/templates", response_model=List[TemplateInfo])
async def get_available_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère la liste des templates disponibles avec leurs descriptions
    """
    try:
        templates = groq_service.get_available_templates()
        
        template_info = {
            "default": {
                "description": "Template standard - Ton enthousiaste et équilibré pour tous types d'établissements",
                "example": "✨ Découvrez Hotel Paradise! Un séjour d'exception vous attend\n📍 Nice, France\n#travel #hotel #nice"
            },
            "luxury": {
                "description": "Template luxe - Vocabulaire sophistiqué et premium pour établissements haut de gamme",
                "example": "💎 Expérience d'exception au Palace Royal\n📍 Monaco, France\n#luxury #prestige #monaco"
            },
            "trendy": {
                "description": "Template branché - Langage moderne et énergique pour hôtels tendance",
                "example": "🔥 Ce spot est INCONTOURNABLE!\n📍 Paris, France\n#vibes #instaworthy #paris"
            },
            "family": {
                "description": "Template familial - Ton chaleureux axé sur les souvenirs et activités famille",
                "example": "❤️ Des souvenirs inoubliables en famille\n📍 Disneyland, France\n#family #memories #disneyland"
            },
            "romantic": {
                "description": "Template romantique - Atmosphère intime pour escapades et lunes de miel",
                "example": "💕 Votre refuge romantique vous attend\n📍 Provence, France\n#romantic #love #provence"
            }
        }
        
        result = []
        for template_name in templates:
            info = template_info.get(template_name, {})
            result.append(TemplateInfo(
                name=template_name,
                description=info.get("description", f"Template {template_name}"),
                example_output=info.get("example", "Exemple non disponible")
            ))
        
        logger.info(f"📋 Retrieved {len(result)} AI templates for user {current_user.email}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Error retrieving AI templates: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des templates")

@router.post("/preview", response_model=GeneratePreviewResponse)
async def generate_template_preview(
    request: GeneratePreviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Génère un aperçu de description avec le template sélectionné
    """
    try:
        # Créer un objet property mock pour la preview
        class MockProperty:
            def __init__(self, name, city, country):
                self.name = name
                self.city = city
                self.country = country
                self.property_type = "hotel"
                self.description = None
                self.address = None
                self.website_url = None
                self.phone = None
                self.instagram_handle = None
        
        mock_property = MockProperty(
            name=request.property_name,
            city=request.city,
            country=request.country
        )
        
        # Générer la description avec le template sélectionné
        description = groq_service.generate_instagram_description(
            property_obj=mock_property,
            user_description=request.user_description,
            prompt_template=request.template_name
        )
        
        logger.info(f"🔮 Generated preview with template '{request.template_name}' for user {current_user.email}")
        
        return GeneratePreviewResponse(
            template_name=request.template_name,
            description=description,
            preview_mode=True
        )
        
    except Exception as e:
        logger.error(f"❌ Error generating template preview: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération de l'aperçu")

@router.get("/templates/{template_name}")
async def get_template_details(
    template_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Récupère les détails d'un template spécifique
    """
    try:
        available_templates = groq_service.get_available_templates()
        
        if template_name not in available_templates:
            raise HTTPException(status_code=404, detail=f"Template '{template_name}' non trouvé")
        
        # Informations détaillées sur chaque template
        template_details = {
            "default": {
                "name": "Default",
                "description": "Template polyvalent et équilibré",
                "characteristics": [
                    "Ton enthousiaste et inspirant",
                    "Emojis standards (✨, 🏨, 📍)",
                    "Hashtags génériques (#travel, #hotel)",
                    "Convient à tous types d'établissements"
                ],
                "best_for": "Hôtels standards, pensions, auberges"
            },
            "luxury": {
                "name": "Luxury", 
                "description": "Template sophistiqué pour le haut de gamme",
                "characteristics": [
                    "Vocabulaire premium et raffiné",
                    "Emojis luxe (💎, ✨, 🥂, 👑)",
                    "Hashtags prestige (#luxury, #prestige, #excellence)",
                    "Met l'accent sur l'exclusivité"
                ],
                "best_for": "Palaces, châteaux-hôtels, resorts 5 étoiles"
            },
            "trendy": {
                "name": "Trendy",
                "description": "Template moderne et énergique", 
                "characteristics": [
                    "Langage jeune et dynamique",
                    "Emojis tendance (🔥, 💫, ⚡, 🎯)",
                    "Hashtags branchés (#vibes, #instaworthy, #mustsee)",
                    "Crée un sentiment d'urgence"
                ],
                "best_for": "Hôtels boutique, hostels, établissements urbains"
            },
            "family": {
                "name": "Family",
                "description": "Template chaleureux pour les familles",
                "characteristics": [
                    "Ton bienveillant et convivial",
                    "Emojis familiaux (👨‍👩‍👧‍👦, 🎉, ❤️, 🏖️)",
                    "Hashtags famille (#family, #memories, #kids)",
                    "Focus sur les souvenirs et activités"
                ],
                "best_for": "Hôtels familiaux, villages vacances, resorts avec enfants"
            },
            "romantic": {
                "name": "Romantic",
                "description": "Template intime pour les couples",
                "characteristics": [
                    "Vocabulaire tendre et évocateur",
                    "Emojis romantiques (💕, 🌹, 🥂, 🌅)",
                    "Hashtags amour (#romantic, #love, #honeymoon)",
                    "Atmosphère romantique et intimiste"
                ],
                "best_for": "Escapades romantiques, lunes de miel, spa couples"
            }
        }
        
        details = template_details.get(template_name, {
            "name": template_name.title(),
            "description": f"Template {template_name}",
            "characteristics": [],
            "best_for": "Usage général"
        })
        
        return {
            "template_name": template_name,
            **details
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retrieving template details: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des détails du template")