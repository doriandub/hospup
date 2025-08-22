"""
API endpoints for video analysis and segment management.

This module provides endpoints to:
1. View video analysis results
2. Search for similar video segments
3. Get analysis statistics
4. Manage viral video templates
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from core.database import get_db
from core.auth import get_current_user
from models.user import User
from models.video import Video
from models.video_segment import VideoSegment
from services.video_analysis_service import video_analysis_service
from services.weaviate_service import weaviate_service

router = APIRouter()

class VideoSegmentResponse(BaseModel):
    """Response model for video segment data"""
    id: str
    video_id: str
    start_time: float
    end_time: float
    duration: float
    description: Optional[str]
    scene_type: Optional[str]
    tags: Optional[List[str]]
    confidence_score: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SimilarSegmentResponse(BaseModel):
    """Response model for similar segment search results"""
    segment: VideoSegmentResponse
    similarity_score: float
    video_title: str
    property_name: str

class VideoAnalysisStatusResponse(BaseModel):
    """Response model for video analysis status"""
    video_id: str
    status: str
    segments_count: int
    analysis_completed_at: Optional[datetime]
    
class AnalysisStatsResponse(BaseModel):
    """Response model for analysis statistics"""
    total_videos_analyzed: int
    total_segments: int
    scene_type_distribution: Dict[str, int]
    average_segments_per_video: float

@router.get("/videos/{video_id}/segments", response_model=List[VideoSegmentResponse])
async def get_video_segments(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all analysis segments for a specific video"""
    
    # Verify video ownership
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id
    ).first()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Get segments
    segments = db.query(VideoSegment).filter(
        VideoSegment.video_id == video_id
    ).order_by(VideoSegment.start_time).all()
    
    return [VideoSegmentResponse.from_orm(segment) for segment in segments]

@router.get("/videos/{video_id}/status", response_model=VideoAnalysisStatusResponse)
async def get_video_analysis_status(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis status for a specific video"""
    
    # Verify video ownership
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id
    ).first()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Count segments
    segments_count = db.query(VideoSegment).filter(
        VideoSegment.video_id == video_id
    ).count()
    
    return VideoAnalysisStatusResponse(
        video_id=video_id,
        status=video.status,
        segments_count=segments_count,
        analysis_completed_at=video.completed_at
    )

@router.post("/search/similar-segments")
async def search_similar_segments(
    query_video_id: str,
    segment_id: Optional[str] = None,
    scene_type: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search for segments similar to a query segment
    
    This is the core function for finding matching content for viral video recreation
    """
    
    # Verify query video ownership
    video = db.query(Video).filter(
        Video.id == query_video_id,
        Video.user_id == current_user.id
    ).first()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query video not found"
        )
    
    # Get query segment
    if segment_id:
        query_segment = db.query(VideoSegment).filter(
            VideoSegment.id == segment_id,
            VideoSegment.video_id == query_video_id
        ).first()
    else:
        # Use first segment of video
        query_segment = db.query(VideoSegment).filter(
            VideoSegment.video_id == query_video_id
        ).order_by(VideoSegment.start_time).first()
    
    if not query_segment or not query_segment.embedding_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Query segment not found or not analyzed"
        )
    
    try:
        # Get query embedding from Weaviate
        # For now, we'll simulate this - in production you'd retrieve the actual embedding
        
        # Search for similar segments (excluding the same video)
        segments = db.query(VideoSegment).join(Video).filter(
            VideoSegment.video_id != query_video_id,
            Video.user_id == current_user.id
        )
        
        if scene_type:
            segments = segments.filter(VideoSegment.scene_type == scene_type)
        
        segments = segments.limit(limit).all()
        
        # Format response with video and property info
        results = []
        for segment in segments:
            video_info = db.query(Video).filter(Video.id == segment.video_id).first()
            property_info = None
            if video_info and video_info.property_id:
                from models.property import Property
                property_info = db.query(Property).filter(Property.id == video_info.property_id).first()
            
            results.append({
                "segment": VideoSegmentResponse.from_orm(segment),
                "similarity_score": 0.85,  # Placeholder - would come from vector similarity
                "video_title": video_info.title if video_info else "Unknown",
                "property_name": property_info.name if property_info else "Unknown"
            })
        
        return results
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching similar segments: {str(e)}"
        )

@router.post("/search/by-description")
async def search_segments_by_description(
    description: str,
    scene_type: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for segments by text description"""
    
    try:
        # Use Weaviate semantic search
        results = weaviate_service.search_by_text_description(description, limit)
        
        # Filter by user ownership and format response
        user_results = []
        for result in results:
            # Get segment from database
            segment = db.query(VideoSegment).filter(
                VideoSegment.embedding_id == result.get('_additional', {}).get('id')
            ).first()
            
            if segment:
                # Verify ownership through video
                video = db.query(Video).filter(
                    Video.id == segment.video_id,
                    Video.user_id == current_user.id
                ).first()
                
                if video:
                    user_results.append({
                        "segment": VideoSegmentResponse.from_orm(segment),
                        "similarity_score": result.get('_additional', {}).get('certainty', 0),
                        "video_title": video.title,
                        "description_match": result.get('description', '')
                    })
        
        return user_results
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching by description: {str(e)}"
        )

@router.get("/stats", response_model=AnalysisStatsResponse)
async def get_analysis_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get analysis statistics for current user"""
    
    # Count analyzed videos
    analyzed_videos = db.query(Video).filter(
        Video.user_id == current_user.id,
        Video.status.in_(["analyzed", "completed"])
    ).count()
    
    # Count total segments
    total_segments = db.query(VideoSegment).join(Video).filter(
        Video.user_id == current_user.id
    ).count()
    
    # Get scene type distribution
    scene_types = db.query(VideoSegment.scene_type, db.func.count(VideoSegment.id)).join(Video).filter(
        Video.user_id == current_user.id,
        VideoSegment.scene_type.isnot(None)
    ).group_by(VideoSegment.scene_type).all()
    
    scene_distribution = {scene_type: count for scene_type, count in scene_types}
    
    # Calculate average
    avg_segments = total_segments / analyzed_videos if analyzed_videos > 0 else 0
    
    return AnalysisStatsResponse(
        total_videos_analyzed=analyzed_videos,
        total_segments=total_segments,
        scene_type_distribution=scene_distribution,
        average_segments_per_video=round(avg_segments, 2)
    )

@router.get("/scene-types")
async def get_available_scene_types(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of available scene types for filtering"""
    
    scene_types = db.query(VideoSegment.scene_type).join(Video).filter(
        Video.user_id == current_user.id,
        VideoSegment.scene_type.isnot(None)
    ).distinct().all()
    
    return [scene_type[0] for scene_type in scene_types]

@router.delete("/videos/{video_id}/analysis")
async def delete_video_analysis(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete analysis data for a video (but keep the video)"""
    
    # Verify video ownership
    video = db.query(Video).filter(
        Video.id == video_id,
        Video.user_id == current_user.id
    ).first()
    
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    try:
        # Delete segments from database (will cascade)
        deleted_count = db.query(VideoSegment).filter(
            VideoSegment.video_id == video_id
        ).delete()
        
        # Delete from Weaviate
        weaviate_service.delete_video_segments(video_id)
        
        # Reset video status
        video.status = "uploaded"
        video.completed_at = None
        
        db.commit()
        
        return {
            "message": f"Deleted analysis for video {video_id}",
            "segments_deleted": deleted_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting analysis: {str(e)}"
        )