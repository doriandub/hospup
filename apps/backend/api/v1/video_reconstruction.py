"""
API endpoints pour la reconstruction vidéo intelligente
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.auth import get_current_user
from core.database import get_db
from models.user import User
from models.viral_video_template import ViralVideoTemplate
from services.video_reconstruction_service import video_reconstruction_service

router = APIRouter()

class VideoReconstructionRequest(BaseModel):
    template_id: str
    property_id: str

@router.post("/reconstruct-video")
async def reconstruct_viral_video(
    request: VideoReconstructionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reconstruit une vidéo virale en matchant le script du template avec les vidéos uploadées
    """
    try:
        from models.property import Property
        
        # Vérifier que l'utilisateur possède bien cette propriété
        property = db.query(Property).filter(
            Property.id == request.property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property:
            raise HTTPException(status_code=404, detail="Property not found or not owned by user")
        
        # Récupérer le template viral
        template = db.query(ViralVideoTemplate).filter(
            ViralVideoTemplate.id == request.template_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Viral template not found")
        
        # Créer le plan de reconstruction
        reconstruction_plan = video_reconstruction_service.create_reconstruction_timeline(
            template=template,
            property_id=request.property_id,
            db=db
        )
        
        if "error" in reconstruction_plan:
            raise HTTPException(status_code=500, detail=reconstruction_plan["error"])
        
        return {
            "success": True,
            "reconstruction_plan": reconstruction_plan,
            "message": f"Plan de reconstruction créé: {reconstruction_plan['statistics']['matched_clips']}/{reconstruction_plan['statistics']['total_clips']} clips matchés"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reconstructing video: {str(e)}")

@router.post("/test-reconstruct-video")
async def test_reconstruct_viral_video(
    request: VideoReconstructionRequest,
    db: Session = Depends(get_db)
):
    """
    Version test sans authentification pour debug
    """
    try:
        # Récupérer le template viral
        template = db.query(ViralVideoTemplate).filter(
            ViralVideoTemplate.id == request.template_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Viral template not found")
        
        # Créer le plan de reconstruction
        reconstruction_plan = video_reconstruction_service.create_reconstruction_timeline(
            template=template,
            property_id=request.property_id,
            db=db
        )
        
        if "error" in reconstruction_plan:
            raise HTTPException(status_code=500, detail=reconstruction_plan["error"])
        
        return {
            "success": True,
            "reconstruction_plan": reconstruction_plan,
            "message": f"Plan de reconstruction créé: {reconstruction_plan['statistics']['matched_clips']}/{reconstruction_plan['statistics']['total_clips']} clips matchés"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reconstructing video: {str(e)}")