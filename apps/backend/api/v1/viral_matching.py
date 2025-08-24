"""
API endpoints for viral video matching and reconstruction.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
import uuid

from core.auth import get_current_user
from core.database import get_db
from sqlalchemy.orm import Session
from models.user import User
from models.viral_video_template import ViralVideoTemplate
from models.user_viewed_template import UserViewedTemplate
from services.viral_matching_service import viral_matching_service
from services.ai_matching_service import ai_matching_service
from services.video_reconstruction_service import video_reconstruction_service

router = APIRouter()

class ViralTemplateResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    popularity_score: float
    total_duration_min: float
    total_duration_max: float
    tags: List[str]
    # Add real social media metrics
    views: Optional[int] = None
    likes: Optional[int] = None
    comments: Optional[int] = None
    followers: Optional[int] = None
    username: Optional[str] = None
    video_link: Optional[str] = None
    script: Optional[str] = None

class MatchedSegmentResponse(BaseModel):
    segment_id: str
    video_id: str
    start_time: float
    end_time: float
    duration: float
    description: str
    scene_type: str
    confidence_score: float

class ViralMatchResponse(BaseModel):
    template: ViralTemplateResponse
    match_score: float
    can_create: bool
    suggested_duration: float
    matched_segments_count: int
    missing_segments_count: int

class ReconstructionTimelineItem(BaseModel):
    start_time: float
    end_time: float
    duration: float
    source_segment: MatchedSegmentResponse
    instructions: str

class ReconstructionResponse(BaseModel):
    template: ViralTemplateResponse
    timeline: List[ReconstructionTimelineItem]
    total_duration: float
    match_score: float
    editing_tips: List[str]
    viral_elements: List[str]

class CreateViralTemplateRequest(BaseModel):
    title: str
    description: str
    category: str
    source_platform: str = "manual"
    segments_pattern: Optional[str] = None
    total_duration_min: float = 15.0
    total_duration_max: float = 60.0
    popularity_score: float = 5.0
    tags: List[str] = []
    
    # Social media data (optional)
    hotel_name: Optional[str] = None
    username: Optional[str] = None
    country: Optional[str] = None
    video_link: Optional[str] = None
    account_link: Optional[str] = None
    followers: Optional[float] = None
    views: Optional[float] = None
    likes: Optional[float] = None
    comments: Optional[float] = None
    duration: Optional[float] = None
    script: Optional[dict] = None

class UpdateViralTemplateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    source_platform: Optional[str] = None
    segments_pattern: Optional[str] = None
    total_duration_min: Optional[float] = None
    total_duration_max: Optional[float] = None
    popularity_score: Optional[float] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    
    # Social media data (optional)
    hotel_name: Optional[str] = None
    username: Optional[str] = None
    country: Optional[str] = None
    video_link: Optional[str] = None
    account_link: Optional[str] = None
    followers: Optional[float] = None
    views: Optional[float] = None
    likes: Optional[float] = None
    comments: Optional[float] = None
    duration: Optional[float] = None
    script: Optional[dict] = None

class RecordTemplateViewRequest(BaseModel):
    template_id: str
    context: Optional[str] = "manual_view"  # "initial_search", "new_idea_1", etc.

@router.get("/properties/{property_id}/viral-matches", response_model=List[ViralMatchResponse])
async def get_viral_matches(
    property_id: str,
    min_score: float = Query(0.6, ge=0.0, le=1.0, description="Minimum match score"),
    current_user: User = Depends(get_current_user)
):
    """
    Find viral video templates that can be created with property's content
    """
    try:
        matches = viral_matching_service.find_matching_templates(
            property_id=property_id,
            min_match_score=min_score
        )
        
        return [
            ViralMatchResponse(
                template=ViralTemplateResponse(**match["template"]),
                match_score=match["match_score"],
                can_create=match["can_create"],
                suggested_duration=match["suggested_duration"],
                matched_segments_count=len(match["matched_segments"]),
                missing_segments_count=len(match["missing_segments"])
            )
            for match in matches
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding viral matches: {str(e)}")

@router.get("/properties/{property_id}/viral-reconstruction/{template_id}", response_model=ReconstructionResponse)
async def get_reconstruction_plan(
    property_id: str,
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a detailed plan for reconstructing a viral video
    """
    try:
        plan = viral_matching_service.suggest_video_reconstruction(
            template_id=template_id,
            property_id=property_id
        )
        
        if not plan:
            raise HTTPException(status_code=404, detail="Cannot create reconstruction plan - insufficient matching content")
        
        return ReconstructionResponse(**plan)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating reconstruction plan: {str(e)}")

@router.get("/viral-templates", response_model=List[ViralTemplateResponse])
async def list_viral_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    platform: Optional[str] = Query(None, description="Filter by source platform"),
    current_user: User = Depends(get_current_user)
):
    """
    List all available viral video templates
    """
    try:
        from core.database import SessionLocal
        from models.viral_video_template import ViralVideoTemplate
        
        db = SessionLocal()
        try:
            # Get all templates from the simplified Airtable structure
            templates = db.query(ViralVideoTemplate).order_by(ViralVideoTemplate.views.desc()).all()
            
            return [
                ViralTemplateResponse(
                    id=template.id,
                    title=template.title or "Vidéo virale",
                    description=f"{template.hotel_name or 'Hôtel'} - {template.property or 'Propriété'} ({template.country or 'Pays'})",
                    category=template.property or "hotel",
                    popularity_score=min(10.0, (template.views or 0) / 100000),  # Convert views to score 0-10
                    total_duration_min=max(15.0, (template.duration or 30.0) - 5),
                    total_duration_max=min(60.0, (template.duration or 30.0) + 10),
                    tags=[template.hotel_name, template.country, template.username] if template.hotel_name else [],
                    # Include real social media metrics
                    views=template.views,
                    likes=template.likes,
                    comments=template.comments,
                    followers=template.followers,
                    username=template.username,
                    video_link=template.video_link,
                    script=template.script
                )
                for template in templates
                if template.title or template.hotel_name  # Only return templates with some content
            ]
            
        finally:
            db.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing templates: {str(e)}")

@router.get("/public-test")
async def public_test():
    """Test endpoint without authentication"""
    from core.database import SessionLocal
    from models.viral_video_template import ViralVideoTemplate
    
    db = SessionLocal()
    try:
        template_count = db.query(ViralVideoTemplate).count()
        return {
            "status": "success",
            "message": f"Generate Idea system is working! {template_count} templates available",
            "templates": template_count,
            "ai_service": "functional"
        }
    finally:
        db.close()

@router.get("/stats")
async def get_viral_matching_stats(current_user: User = Depends(get_current_user)):
    """
    Get statistics about viral video matching system
    """
    try:
        from core.database import SessionLocal
        from models.viral_video_template import ViralVideoTemplate
        from models.video_segment import VideoSegment
        from sqlalchemy import func
        
        db = SessionLocal()
        try:
            # Count templates by property type (country)
            template_stats = db.query(
                ViralVideoTemplate.country,
                func.count(ViralVideoTemplate.id).label('count')
            ).group_by(ViralVideoTemplate.country).all()
            
            return {
                "viral_templates": {
                    "total": db.query(ViralVideoTemplate).count(),
                    "by_category": {stat.country or "unknown": stat.count for stat in template_stats}
                },
                "analyzed_segments": {
                    "total": 0,  # No video segments table for now
                    "by_scene_type": {}
                }
            }
            
        finally:
            db.close()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

@router.post("/viral-templates", response_model=ViralTemplateResponse)
async def create_viral_template(
    template_data: CreateViralTemplateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new viral video template
    """
    try:
        # Create new template
        template = ViralVideoTemplate(
            id=str(uuid.uuid4()),
            title=template_data.title,
            description=template_data.description,
            category=template_data.category,
            source_platform=template_data.source_platform,
            segments_pattern=template_data.segments_pattern,
            total_duration_min=template_data.total_duration_min,
            total_duration_max=template_data.total_duration_max,
            popularity_score=template_data.popularity_score,
            tags=template_data.tags,
            
            # Social media data
            hotel_name=template_data.hotel_name,
            username=template_data.username,
            country=template_data.country,
            video_link=template_data.video_link,
            account_link=template_data.account_link,
            followers=template_data.followers,
            views=template_data.views,
            likes=template_data.likes,
            comments=template_data.comments,
            duration=template_data.duration,
            script=template_data.script,
            
            is_active=True
        )
        
        db.add(template)
        db.commit()
        db.refresh(template)
        
        return ViralTemplateResponse(
            id=template.id,
            title=template.title,
            description=template.description,
            category=template.category,
            popularity_score=template.popularity_score,
            total_duration_min=template.total_duration_min,
            total_duration_max=template.total_duration_max,
            tags=template.tags
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating template: {str(e)}")

@router.put("/viral-templates/{template_id}", response_model=ViralTemplateResponse)
async def update_viral_template(
    template_id: str,
    template_data: UpdateViralTemplateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing viral video template
    """
    try:
        template = db.query(ViralVideoTemplate).filter(ViralVideoTemplate.id == template_id).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Update fields if provided
        update_data = template_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        db.commit()
        db.refresh(template)
        
        return ViralTemplateResponse(
            id=template.id,
            title=template.title,
            description=template.description,
            category=template.category,
            popularity_score=template.popularity_score,
            total_duration_min=template.total_duration_min,
            total_duration_max=template.total_duration_max,
            tags=template.tags
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating template: {str(e)}")

@router.delete("/viral-templates/{template_id}")
async def delete_viral_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a viral video template
    """
    try:
        template = db.query(ViralVideoTemplate).filter(ViralVideoTemplate.id == template_id).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        db.delete(template)
        db.commit()
        
        return {"message": "Template deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting template: {str(e)}")

@router.get("/viral-templates/{template_id}", response_model=ViralTemplateResponse)
async def get_viral_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific viral video template
    """
    try:
        template = db.query(ViralVideoTemplate).filter(ViralVideoTemplate.id == template_id).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        return ViralTemplateResponse(
            id=template.id,
            title=template.title or "Vidéo virale",
            description=f"{template.hotel_name or 'Hôtel'} - {template.property or 'Propriété'} ({template.country or 'Pays'})",
            category=template.property or "hotel",
            popularity_score=min(10.0, (template.views or 0) / 100000),
            total_duration_min=max(15.0, (template.duration or 30.0) - 5),
            total_duration_max=min(60.0, (template.duration or 30.0) + 10),
            tags=[template.hotel_name, template.country, template.username] if template.hotel_name else [],
            # Include real social media metrics
            views=template.views,
            likes=template.likes,
            comments=template.comments,
            followers=template.followers,
            username=template.username,
            video_link=template.video_link,
            script=template.script
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting template: {str(e)}")

class SmartMatchRequest(BaseModel):
    property_id: str
    user_description: str
    exclude_template_id: Optional[str] = None

@router.post("/test-smart-match", response_model=ViralTemplateResponse)
async def test_smart_match_template(
    request: SmartMatchRequest,
    db: Session = Depends(get_db)
):
    """
    Version de test sans authentification pour debug
    """
    try:
        # Get all templates for testing, excluding the one specified if provided
        query = db.query(ViralVideoTemplate)
        if request.exclude_template_id:
            query = query.filter(ViralVideoTemplate.id != request.exclude_template_id)
        
        templates = query.all()
        
        if not templates:
            raise HTTPException(status_code=404, detail="No viral templates available")
        
        # Use AI service to find best matches
        scored_templates = ai_matching_service.find_best_matches(
            user_description=request.user_description,
            property_description="Test property",
            templates=templates,
            top_k=10
        )
        
        if not scored_templates:
            raise HTTPException(status_code=404, detail="No matching templates found")
        
        # Get the best match
        best_match = scored_templates[0]['template']
        
        return ViralTemplateResponse(
            id=best_match.id,
            title=best_match.title or "Vidéo virale recommandée",
            description=f"{best_match.hotel_name or 'Hôtel'} - {best_match.property or 'Propriété'} ({best_match.country or 'Pays'})\n\nCorrespondance trouvée pour: {request.user_description}",
            category=best_match.property or "hotel",
            popularity_score=min(10.0, (best_match.views or 0) / 100000),
            total_duration_min=max(15.0, (best_match.duration or 30.0) - 5),
            total_duration_max=min(60.0, (best_match.duration or 30.0) + 10),
            tags=[best_match.hotel_name, best_match.country, best_match.username] if best_match.hotel_name else [],
            views=best_match.views,
            likes=best_match.likes,
            comments=best_match.comments,
            followers=best_match.followers,
            username=best_match.username,
            video_link=best_match.video_link,
            script=best_match.script
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding smart match: {str(e)}")

@router.post("/smart-match", response_model=ViralTemplateResponse)
async def smart_match_template(
    request: SmartMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Intelligently match a viral template based on property details and user description
    """
    try:
        from models.property import Property
        
        # Get property details
        property = db.query(Property).filter(
            Property.id == request.property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Get all viral templates, excluding the one specified if provided
        query = db.query(ViralVideoTemplate)
        if request.exclude_template_id:
            query = query.filter(ViralVideoTemplate.id != request.exclude_template_id)
        
        templates = query.all()
        
        if not templates:
            raise HTTPException(status_code=404, detail="No viral templates available")
        
        # AI-POWERED MATCHING using semantic similarity
        # Prepare property information for AI matching
        property_info = f"{property.name or ''} {property.description or ''} {property.property_type or ''} {property.country or ''}"
        
        # Use AI service to find best matches (simplified algorithm)
        scored_templates = ai_matching_service.find_best_matches(
            user_description=request.user_description,
            property_description=property_info,
            templates=templates,
            top_k=10  # Get top 10 matches
        )
        
        if not scored_templates:
            raise HTTPException(status_code=404, detail="No matching templates found")
        
        # Get the best match
        best_match = scored_templates[0]['template']
        
        # Record this suggestion in user's history
        from services.viral_suggestion_service import viral_suggestion_service
        viral_suggestion_service.record_suggestion(
            user_id=current_user.id,
            viral_video_id=best_match.id,
            context=request.user_description,
            property_id=request.property_id
        )
        
        return ViralTemplateResponse(
            id=best_match.id,
            title=best_match.title or "Vidéo virale recommandée",
            description=f"{best_match.hotel_name or 'Hôtel'} - {best_match.property or 'Propriété'} ({best_match.country or 'Pays'})\n\nCorrespondance trouvée pour: {request.user_description}",
            category=best_match.property or "hotel",
            popularity_score=min(10.0, (best_match.views or 0) / 100000),
            total_duration_min=max(15.0, (best_match.duration or 30.0) - 5),
            total_duration_max=min(60.0, (best_match.duration or 30.0) + 10),
            tags=[best_match.hotel_name, best_match.country, best_match.username] if best_match.hotel_name else [],
            # Include real social media metrics
            views=best_match.views,
            likes=best_match.likes,
            comments=best_match.comments,
            followers=best_match.followers,
            username=best_match.username,
            video_link=best_match.video_link,
            script=best_match.script
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error finding smart match: {str(e)}")

@router.get("/user-viral-history", response_model=List[ViralTemplateResponse])
async def get_user_viral_history(
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100, description="Number of suggestions to retrieve")
):
    """
    Get user's viral video suggestion history - only videos that have been previously suggested to this user
    """
    try:
        from services.viral_suggestion_service import viral_suggestion_service
        
        # Get user's viral suggestion history
        suggestions = viral_suggestion_service.get_user_viral_history(
            user_id=current_user.id,
            limit=limit
        )
        
        # Convert to ViralTemplateResponse format
        return [
            ViralTemplateResponse(
                id=suggestion["id"],
                title=suggestion["title"],
                description=suggestion["description"],
                category=suggestion["category"],
                popularity_score=suggestion["popularity_score"],
                total_duration_min=suggestion["total_duration_min"],
                total_duration_max=suggestion["total_duration_max"],
                tags=suggestion["tags"],
                views=suggestion.get("views"),
                likes=suggestion.get("likes"),
                comments=suggestion.get("comments"),
                followers=suggestion.get("followers"),
                username=suggestion.get("username"),
                video_link=suggestion.get("video_link"),
                script=suggestion.get("script")
            )
            for suggestion in suggestions
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving viral history: {str(e)}")

@router.post("/record-template-view")
async def record_template_view(
    request: RecordTemplateViewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Record that a user has viewed a viral template and automatically add to Viral Inspiration
    """
    try:
        import uuid as uuid_lib
        from datetime import datetime
        
        # Check if template exists
        template = db.query(ViralVideoTemplate).filter(
            ViralVideoTemplate.id == request.template_id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Check if user has already viewed this template
        existing_view = db.query(UserViewedTemplate).filter(
            UserViewedTemplate.user_id == current_user.id,
            UserViewedTemplate.viral_template_id == request.template_id
        ).first()
        
        if existing_view:
            # Update the context if it's different
            if existing_view.context != request.context:
                existing_view.context = request.context
                existing_view.viewed_at = datetime.utcnow()
                db.commit()
            
            return {
                "status": "already_viewed", 
                "message": "Template view updated",
                "template_id": request.template_id,
                "context": request.context
            }
        
        # Record new view
        new_view = UserViewedTemplate(
            id=uuid_lib.uuid4(),
            user_id=current_user.id,
            viral_template_id=request.template_id,
            viewed_at=datetime.utcnow(),
            context=request.context
        )
        
        db.add(new_view)
        
        # Automatically add to user's Viral Inspiration using existing service
        from services.viral_suggestion_service import viral_suggestion_service
        viral_suggestion_service.record_suggestion(
            user_id=current_user.id,
            viral_video_id=request.template_id,
            context=f"Auto-added from view: {request.context}",
            property_id=None  # No specific property for viewed templates
        )
        
        db.commit()
        
        return {
            "status": "recorded",
            "message": "Template view recorded and added to Viral Inspiration",
            "template_id": request.template_id,
            "context": request.context,
            "viewed_at": new_view.viewed_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error recording template view: {str(e)}")

@router.get("/viewed-templates", response_model=List[ViralTemplateResponse])
async def get_viewed_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100, description="Number of viewed templates to retrieve")
):
    """
    Get all viral templates that the user has viewed
    """
    try:
        # Get user's viewed templates with template data
        viewed_templates = db.query(UserViewedTemplate, ViralVideoTemplate).join(
            ViralVideoTemplate, UserViewedTemplate.viral_template_id == ViralVideoTemplate.id
        ).filter(
            UserViewedTemplate.user_id == current_user.id
        ).order_by(
            UserViewedTemplate.viewed_at.desc()
        ).limit(limit).all()
        
        return [
            ViralTemplateResponse(
                id=template.id,
                title=template.title or "Vidéo virale vue",
                description=f"{template.hotel_name or 'Hôtel'} - {template.property or 'Propriété'} ({template.country or 'Pays'})",
                category=template.property or "hotel",
                popularity_score=min(10.0, (template.views or 0) / 100000),
                total_duration_min=max(15.0, (template.duration or 30.0) - 5),
                total_duration_max=min(60.0, (template.duration or 30.0) + 10),
                tags=[template.hotel_name, template.country, template.username] if template.hotel_name else [],
                views=template.views,
                likes=template.likes,
                comments=template.comments,
                followers=template.followers,
                username=template.username,
                video_link=template.video_link,
                script=template.script
            )
            for view, template in viewed_templates
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving viewed templates: {str(e)}")