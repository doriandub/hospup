from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from core.auth import get_current_user
from models.user import User
from models.property import Property
from core.database import get_db
from sqlalchemy.orm import Session
import random

router = APIRouter()

# Suggestions de texte prédéfinies par catégorie
TEXT_SUGGESTIONS = {
    "hotel": [
        "Bienvenue dans votre havre de paix",
        "Une expérience inoubliable vous attend",
        "Réservez dès maintenant",
        "L'hospitalité à la française",
        "Votre séjour de rêve commence ici",
        "Découvrez l'excellence hôtelière",
        "Des moments précieux à partager",
        "Votre confort est notre priorité",
        "L'art de recevoir à la perfection",
        "Échappez-vous du quotidien"
    ],
    "restaurant": [
        "Savourez nos spécialités",
        "Une cuisine d'exception",
        "Des saveurs authentiques",
        "L'art culinaire à son apogée",
        "Goûtez la différence",
        "Une expérience gustative unique",
        "Réservez votre table",
        "Chef recommande",
        "Tradition et innovation",
        "Le plaisir des sens"
    ],
    "spa": [
        "Détendez-vous, vous le méritez",
        "Un moment rien qu'à vous",
        "Retrouvez votre équilibre",
        "L'art du bien-être",
        "Prenez soin de vous",
        "Une parenthèse de douceur",
        "Ressourcez-vous",
        "Harmonie corps et esprit",
        "Votre oasis de tranquillité",
        "Régénérez votre énergie"
    ],
    "generic": [
        "Découvrez notre établissement",
        "Une expérience unique",
        "Rejoignez-nous",
        "L'excellence au quotidien",
        "Votre satisfaction garantie",
        "Créons ensemble des souvenirs",
        "Au cœur de l'authenticité",
        "Passez un moment d'exception",
        "Nous vous attendons",
        "Laissez-vous surprendre"
    ],
    "call_to_action": [
        "Réservez maintenant",
        "Contactez-nous",
        "Découvrez nos offres",
        "Profitez de -20%",
        "Offre limitée",
        "Appelez-nous",
        "Visitez notre site",
        "Suivez-nous",
        "Partagez l'expérience",
        "Ne manquez pas cette occasion"
    ],
    "seasonal": [
        "Célébrez les fêtes avec nous",
        "Offre spéciale été",
        "Week-end romantique",
        "Séjour détente",
        "Escapade gourmande",
        "Package famille",
        "Promotion printemps",
        "Vacances d'hiver",
        "Nouvel An inoubliable",
        "Saint-Valentin parfaite"
    ]
}

@router.get("/suggestions", response_model=Dict[str, Any])
async def get_text_suggestions(
    property_id: str = None,
    category: str = "generic",
    count: int = 8,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Génère des suggestions de texte pour les overlays vidéo
    """
    try:
        suggestions = []
        
        # Si une propriété est spécifiée, personnaliser selon le type
        if property_id:
            property_obj = db.query(Property).filter(
                Property.id == property_id,
                Property.user_id == current_user.id
            ).first()
            
            if property_obj:
                # Détermine la catégorie selon le type de propriété
                if property_obj.property_type:
                    prop_type = property_obj.property_type.lower()
                    if 'hotel' in prop_type or 'resort' in prop_type:
                        category = "hotel"
                    elif 'restaurant' in prop_type or 'cafe' in prop_type:
                        category = "restaurant"
                    elif 'spa' in prop_type or 'wellness' in prop_type:
                        category = "spa"
                
                # Ajoute des suggestions personnalisées avec le nom de la propriété
                property_name = property_obj.name
                personalized = [
                    f"Bienvenue au {property_name}",
                    f"Découvrez {property_name}",
                    f"{property_name} vous accueille",
                    f"Réservez au {property_name}",
                ]
                suggestions.extend(personalized)
        
        # Récupère les suggestions de la catégorie demandée
        category_suggestions = TEXT_SUGGESTIONS.get(category, TEXT_SUGGESTIONS["generic"])
        suggestions.extend(category_suggestions)
        
        # Mélange et limite le nombre
        random.shuffle(suggestions)
        suggestions = suggestions[:count]
        
        # Ajoute toujours quelques call-to-action
        cta_suggestions = random.sample(TEXT_SUGGESTIONS["call_to_action"], min(2, len(TEXT_SUGGESTIONS["call_to_action"])))
        suggestions.extend(cta_suggestions)
        
        # Limite finale
        suggestions = suggestions[:count]
        
        return {
            "suggestions": suggestions,
            "category": category,
            "total": len(suggestions),
            "property_id": property_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération des suggestions: {str(e)}")

@router.get("/categories", response_model=Dict[str, Any])
async def get_text_categories():
    """
    Retourne les catégories de suggestions disponibles
    """
    return {
        "categories": [
            {"id": "generic", "name": "Général", "description": "Suggestions générales"},
            {"id": "hotel", "name": "Hôtellerie", "description": "Suggestions pour hôtels et hébergements"},
            {"id": "restaurant", "name": "Restauration", "description": "Suggestions pour restaurants et cafés"},
            {"id": "spa", "name": "Bien-être", "description": "Suggestions pour spas et centres de bien-être"},
            {"id": "call_to_action", "name": "Appel à l'action", "description": "Phrases d'incitation"},
            {"id": "seasonal", "name": "Saisonnier", "description": "Suggestions selon les saisons et événements"}
        ]
    }