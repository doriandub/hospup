"""
Text customization endpoints for video generation
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from core.database import get_db
from core.auth import get_current_user
from models.user import User
from models.property import Property
from constants.text_fonts import AVAILABLE_FONTS, TEXT_SIZES, COLOR_PRESETS, get_font_by_id, get_text_size_config

router = APIRouter()

class TextCustomizationRequest(BaseModel):
    property_id: str
    text_font: Optional[str] = "helvetica"
    text_color: Optional[str] = "#FFFFFF"
    text_size: Optional[str] = "medium"
    text_shadow: Optional[bool] = False
    text_outline: Optional[bool] = False 
    text_background: Optional[bool] = False

class TextCustomizationResponse(BaseModel):
    property_id: str
    text_font: str
    text_color: str
    text_size: str
    text_shadow: bool
    text_outline: bool
    text_background: bool
    
    class Config:
        from_attributes = True

@router.get("/fonts", dependencies=[])  # No auth required for font list
async def get_available_fonts():
    """Get list of available fonts with previews"""
    return {
        "fonts": AVAILABLE_FONTS,
        "sizes": TEXT_SIZES,
        "colors": COLOR_PRESETS
    }

@router.get("/properties/{property_id}/text-settings")
async def get_text_settings(
    property_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current text customization settings for a property"""
    
    # Verify property belongs to user
    property_obj = db.query(Property).filter(
        Property.id == property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    
    return {
        "property_id": property_obj.id,
        "text_font": property_obj.text_font or "helvetica",
        "text_color": property_obj.text_color or "#FFFFFF", 
        "text_size": property_obj.text_size or "medium",
        "text_shadow": property_obj.text_shadow or False,
        "text_outline": property_obj.text_outline or False,
        "text_background": property_obj.text_background or False,
        "preview": {
            "font_info": get_font_by_id(property_obj.text_font or "helvetica"),
            "size_info": get_text_size_config(property_obj.text_size or "medium")
        }
    }

@router.put("/properties/{property_id}/text-settings")
async def update_text_settings(
    property_id: str,
    settings: TextCustomizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update text customization settings for a property"""
    
    # Verify property belongs to user
    property_obj = db.query(Property).filter(
        Property.id == property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Validate font exists
    if settings.text_font and not get_font_by_id(settings.text_font):
        raise HTTPException(status_code=400, detail="Invalid font selection")
    
    # Validate text size
    if settings.text_size and settings.text_size not in TEXT_SIZES:
        raise HTTPException(status_code=400, detail="Invalid text size")
    
    # Update property settings
    property_obj.text_font = settings.text_font
    property_obj.text_color = settings.text_color
    property_obj.text_size = settings.text_size
    property_obj.text_shadow = settings.text_shadow
    property_obj.text_outline = settings.text_outline
    property_obj.text_background = settings.text_background
    
    db.commit()
    
    return {
        "message": "Text settings updated successfully",
        "settings": {
            "property_id": property_obj.id,
            "text_font": property_obj.text_font,
            "text_color": property_obj.text_color,
            "text_size": property_obj.text_size, 
            "text_shadow": property_obj.text_shadow,
            "text_outline": property_obj.text_outline,
            "text_background": property_obj.text_background
        }
    }

@router.post("/properties/{property_id}/text-preview")
async def generate_text_preview(
    property_id: str,
    settings: TextCustomizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a preview of text with current settings"""
    
    # Verify property belongs to user
    property_obj = db.query(Property).filter(
        Property.id == property_id,
        Property.user_id == current_user.id
    ).first()
    
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get font and size info
    font_info = get_font_by_id(settings.text_font)
    size_info = get_text_size_config(settings.text_size)
    
    # Create preview configuration for frontend
    preview_config = {
        "sample_text": f"Bienvenue au {property_obj.name}",
        "font": {
            "family": font_info["display_name"],
            "style": font_info["style"]
        },
        "color": settings.text_color,
        "size": {
            "name": settings.text_size,
            "pixels": int(size_info["relative"] * 1080),
            "description": size_info["description"]
        },
        "effects": {
            "shadow": settings.text_shadow,
            "outline": settings.text_outline,
            "background": settings.text_background
        }
    }
    
    return {"preview": preview_config}