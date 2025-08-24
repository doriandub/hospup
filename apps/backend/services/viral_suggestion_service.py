"""
Service for managing viral video suggestion history
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.viral_suggestion_history import ViralSuggestionHistory
from models.viral_video_template import ViralVideoTemplate
from models.user import User
import logging

logger = logging.getLogger(__name__)

class ViralSuggestionService:
    """Service for tracking and retrieving viral video suggestions"""
    
    def record_suggestion(
        self, 
        user_id: str, 
        viral_video_id: str, 
        context: Optional[str] = None,
        property_id: Optional[str] = None
    ) -> bool:
        """
        Record that a viral video was suggested to a user
        Returns True if recorded, False if already exists
        """
        db = SessionLocal()
        try:
            # Check if already exists (using UNIQUE constraint)
            existing = db.query(ViralSuggestionHistory).filter(
                ViralSuggestionHistory.user_id == user_id,
                ViralSuggestionHistory.viral_video_id == viral_video_id
            ).first()
            
            if existing:
                # Update context if provided
                if context:
                    existing.context = context
                if property_id:
                    existing.property_id = property_id
                db.commit()
                return False  # Already existed
            
            # Create new suggestion record
            suggestion = ViralSuggestionHistory(
                user_id=user_id,
                viral_video_id=viral_video_id,
                context=context,
                property_id=property_id
            )
            
            db.add(suggestion)
            db.commit()
            
            logger.info(f"✅ Recorded viral suggestion: user={user_id}, viral_video={viral_video_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error recording viral suggestion: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    def get_user_viral_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get all viral videos that have been suggested to a user
        Returns list of viral templates with suggestion metadata
        """
        db = SessionLocal()
        try:
            # Get suggestions with viral video data
            suggestions = db.query(ViralSuggestionHistory).join(
                ViralVideoTemplate
            ).filter(
                ViralSuggestionHistory.user_id == user_id
            ).order_by(
                ViralSuggestionHistory.suggested_at.desc()
            ).limit(limit).all()
            
            result = []
            for suggestion in suggestions:
                viral_video = suggestion.viral_video
                result.append({
                    "id": viral_video.id,
                    "title": viral_video.title or "Vidéo virale",
                    "description": f"{viral_video.hotel_name or 'Hôtel'} - {viral_video.property or 'Propriété'} ({viral_video.country or 'Pays'})",
                    "category": viral_video.property or "hotel",
                    "popularity_score": min(10.0, (viral_video.views or 0) / 100000),
                    "total_duration_min": max(15.0, (viral_video.duration or 30.0) - 5),
                    "total_duration_max": min(60.0, (viral_video.duration or 30.0) + 10),
                    "tags": [viral_video.hotel_name, viral_video.country, viral_video.username] if viral_video.hotel_name else [],
                    "views": viral_video.views,
                    "likes": viral_video.likes,
                    "comments": viral_video.comments,
                    "followers": viral_video.followers,
                    "username": viral_video.username,
                    "video_link": viral_video.video_link,
                    "script": viral_video.script,
                    # Suggestion metadata
                    "suggested_at": suggestion.suggested_at.isoformat() if suggestion.suggested_at else None,
                    "context": suggestion.context,
                    "property_id": suggestion.property_id
                })
            
            logger.info(f"📚 Retrieved {len(result)} viral suggestions for user {user_id}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error retrieving viral history: {e}")
            return []
        finally:
            db.close()
    
    def get_suggestion_stats(self, user_id: str) -> Dict[str, Any]:
        """Get statistics about user's viral suggestions"""
        db = SessionLocal()
        try:
            total = db.query(ViralSuggestionHistory).filter(
                ViralSuggestionHistory.user_id == user_id
            ).count()
            
            return {
                "total_suggestions": total,
                "has_suggestions": total > 0
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting suggestion stats: {e}")
            return {"total_suggestions": 0, "has_suggestions": False}
        finally:
            db.close()

# Create singleton instance
viral_suggestion_service = ViralSuggestionService()