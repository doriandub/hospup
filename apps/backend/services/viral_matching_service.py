"""
Service for matching user video content to viral video patterns.

This service analyzes user's video segments and finds which viral video templates
they can recreate based on their available content.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.database import SessionLocal
from models.video_segment import VideoSegment
from models.viral_video_template import ViralVideoTemplate
from models.video import Video

logger = logging.getLogger(__name__)

class ViralMatchingService:
    """Service for matching user content to viral video patterns"""
    
    def find_matching_templates(self, property_id: str, min_match_score: float = 0.6) -> List[Dict[str, Any]]:
        """
        Find viral video templates that can be created with user's content
        
        Args:
            property_id: Property ID to search content for
            min_match_score: Minimum matching score (0-1) to consider a match
            
        Returns:
            List of matching templates with their match details
        """
        db = SessionLocal()
        try:
            # Get all active viral templates
            templates = db.query(ViralVideoTemplate).filter(
                ViralVideoTemplate.is_active == True
            ).all()
            
            # Get all analyzed segments for this property
            segments = db.query(VideoSegment).join(Video).filter(
                Video.property_id == property_id,
                Video.status == "completed"
            ).all()
            
            if not segments:
                logger.info(f"No analyzed segments found for property {property_id}")
                return []
            
            matches = []
            
            for template in templates:
                match_result = self._check_template_match(template, segments)
                if match_result["score"] >= min_match_score:
                    matches.append({
                        "template": {
                            "id": template.id,
                            "title": template.title,
                            "description": template.description,
                            "category": template.category,
                            "popularity_score": template.popularity_score,
                            "total_duration_min": template.total_duration_min,
                            "total_duration_max": template.total_duration_max,
                            "tags": template.tags
                        },
                        "match_score": match_result["score"],
                        "matched_segments": match_result["matched_segments"],
                        "missing_segments": match_result["missing_segments"],
                        "can_create": match_result["can_create"],
                        "suggested_duration": match_result["suggested_duration"]
                    })
            
            # Sort by match score (highest first)
            matches.sort(key=lambda x: x["match_score"], reverse=True)
            
            logger.info(f"Found {len(matches)} matching templates for property {property_id}")
            return matches
            
        except Exception as e:
            logger.error(f"Error finding matching templates: {e}")
            return []
        finally:
            db.close()
    
    def _check_template_match(self, template: ViralVideoTemplate, segments: List[VideoSegment]) -> Dict[str, Any]:
        """
        Check how well user segments match a viral template
        
        Returns:
            Dictionary with match details
        """
        pattern = template.segments_pattern
        matched_segments = []
        missing_segments = []
        total_score = 0.0
        
        # Group segments by scene type for easier matching
        segments_by_type = {}
        for segment in segments:
            scene_type = segment.scene_type or "general"
            if scene_type not in segments_by_type:
                segments_by_type[scene_type] = []
            segments_by_type[scene_type].append(segment)
        
        # Check each required segment in the pattern
        for pattern_segment in pattern:
            required_type = pattern_segment["scene_type"]
            is_required = pattern_segment.get("required", True)
            min_duration = pattern_segment.get("duration_min", 0)
            max_duration = pattern_segment.get("duration_max", 999)
            required_keywords = pattern_segment.get("description_contains", [])
            
            # Find matching segments
            matching_segments = []
            
            if required_type in segments_by_type:
                for segment in segments_by_type[required_type]:
                    # Check duration match
                    duration_match = min_duration <= segment.duration <= max_duration
                    
                    # Check keyword match
                    keyword_match = True
                    if required_keywords:
                        description_lower = (segment.description or "").lower()
                        keyword_match = any(keyword.lower() in description_lower for keyword in required_keywords)
                    
                    if duration_match and keyword_match:
                        matching_segments.append({
                            "segment_id": segment.id,
                            "video_id": segment.video_id,
                            "start_time": segment.start_time,
                            "end_time": segment.end_time,
                            "duration": segment.duration,
                            "description": segment.description,
                            "scene_type": segment.scene_type,
                            "confidence_score": segment.confidence_score
                        })
            
            if matching_segments:
                # Found matching content for this pattern segment
                matched_segments.append({
                    "pattern_segment": pattern_segment,
                    "matching_segments": matching_segments,
                    "best_match": max(matching_segments, key=lambda x: x["confidence_score"] or 0)
                })
                
                # Calculate score for this segment
                if is_required:
                    total_score += 1.0  # Full points for required segments
                else:
                    total_score += 0.5  # Half points for optional segments
            else:
                # Missing content for this pattern segment
                missing_segments.append({
                    "pattern_segment": pattern_segment,
                    "reason": f"No {required_type} scenes" + (f" with keywords: {', '.join(required_keywords)}" if required_keywords else "")
                })
                
                if is_required:
                    # Penalty for missing required segments
                    total_score -= 0.5
        
        # Calculate final match score
        total_possible = len([p for p in pattern if p.get("required", True)]) + (len([p for p in pattern if not p.get("required", True)]) * 0.5)
        match_score = max(0.0, total_score / total_possible) if total_possible > 0 else 0.0
        
        # Determine if video can be created
        required_segments = [p for p in pattern if p.get("required", True)]
        can_create = len([m for m in matched_segments if m["pattern_segment"].get("required", True)]) >= len(required_segments)
        
        # Suggest total duration
        if matched_segments:
            total_matched_duration = sum(m["best_match"]["duration"] for m in matched_segments)
            suggested_duration = max(template.total_duration_min or 0, min(template.total_duration_max or 60, total_matched_duration))
        else:
            suggested_duration = template.total_duration_min or 10
        
        return {
            "score": match_score,
            "matched_segments": matched_segments,
            "missing_segments": missing_segments,
            "can_create": can_create,
            "suggested_duration": suggested_duration
        }
    
    def suggest_video_reconstruction(self, template_id: str, property_id: str) -> Optional[Dict[str, Any]]:
        """
        Create a detailed suggestion for reconstructing a viral video
        
        Args:
            template_id: ID of the viral template to reconstruct
            property_id: Property ID to source content from
            
        Returns:
            Detailed reconstruction plan
        """
        db = SessionLocal()
        try:
            # Get template
            template = db.query(ViralVideoTemplate).filter(
                ViralVideoTemplate.id == template_id,
                ViralVideoTemplate.is_active == True
            ).first()
            
            if not template:
                return None
            
            # Get matching analysis
            matches = self.find_matching_templates(property_id)
            template_match = next((m for m in matches if m["template"]["id"] == template_id), None)
            
            if not template_match or not template_match["can_create"]:
                return None
            
            # Create reconstruction plan
            timeline = []
            current_time = 0.0
            
            for match in template_match["matched_segments"]:
                pattern_seg = match["pattern_segment"]
                best_segment = match["best_match"]
                
                # Calculate segment duration (optimize for viral format)
                target_duration = min(pattern_seg["duration_max"], max(pattern_seg["duration_min"], best_segment["duration"]))
                
                timeline.append({
                    "start_time": current_time,
                    "end_time": current_time + target_duration,
                    "duration": target_duration,
                    "source_segment": best_segment,
                    "pattern_segment": pattern_seg,
                    "instructions": f"Use {best_segment['scene_type']} scene from {best_segment['duration']:.1f}s segment"
                })
                
                current_time += target_duration
            
            return {
                "template": template_match["template"],
                "timeline": timeline,
                "total_duration": current_time,
                "match_score": template_match["match_score"],
                "editing_tips": self._generate_editing_tips(template, timeline),
                "viral_elements": self._extract_viral_elements(template)
            }
            
        except Exception as e:
            logger.error(f"Error creating reconstruction suggestion: {e}")
            return None
        finally:
            db.close()
    
    def _generate_editing_tips(self, template: ViralVideoTemplate, timeline: List[Dict]) -> List[str]:
        """Generate editing tips based on template and timeline"""
        tips = []
        
        if template.category == "lifestyle":
            tips.extend([
                "Use quick cuts between scenes for energy",
                "Add upbeat background music",
                "Include text overlays with routine steps"
            ])
        elif template.category == "travel":
            tips.extend([
                "Emphasize luxury details with close-ups",
                "Use smooth transitions between rooms",
                "Add location tags and property highlights"
            ])
        
        if len(timeline) > 3:
            tips.append("Keep segments short (2-4s each) for maximum engagement")
        
        tips.append(f"Optimal duration: {template.total_duration_min:.0f}-{template.total_duration_max:.0f} seconds")
        
        return tips
    
    def _extract_viral_elements(self, template: ViralVideoTemplate) -> List[str]:
        """Extract what makes this template viral"""
        elements = []
        
        if "routine" in template.tags:
            elements.append("Routine reveal format")
        if "luxury" in template.tags:
            elements.append("Luxury lifestyle appeal")
        if "aesthetic" in template.tags:
            elements.append("Visual aesthetics focus")
        
        elements.append(f"Popular on {template.source_platform}")
        elements.append(f"High engagement potential ({template.popularity_score}/10)")
        
        return elements

# Create singleton instance
viral_matching_service = ViralMatchingService()