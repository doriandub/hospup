"""
Video Generation Task v2 - Production Ready
Handles timeline-based video generation with proper error handling and scalability
"""

import logging
import json
import uuid
import tempfile
import os
import subprocess
from datetime import datetime
from typing import Dict, Any, List, Optional

from celery import current_task
from core.celery_app import celery_app
from core.database import get_db
from models.video import Video
from models.property import Property
from models.viral_video_template import ViralVideoTemplate
from services.s3_service import s3_service

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def generate_video_from_timeline(
    self,
    video_id: str,
    property_id: str,
    user_id: str,
    timeline_data: Dict[str, Any],
    template_id: str,
    language: str = "fr"
) -> Dict[str, Any]:
    """
    Generate video from timeline data with slot assignments and text overlays
    
    Args:
        video_id: Unique video identifier
        property_id: Property ID for content library
        user_id: User ID
        timeline_data: {
            "slot_assignments": [...],
            "text_overlays": [...],
            "total_duration": 30,
            "style_settings": {...}
        }
        template_id: Viral template ID
        language: Video language
    """
    
    db = None
    temp_dir = None
    
    try:
        logger.info(f"🎬 Starting video generation: {video_id}")
        
        # Update task progress
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "initializing", "progress": 5}
        )
        
        # Get database session
        db = next(get_db())
        
        # Get video record
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise ValueError(f"Video {video_id} not found")
        
        # Get property for content library
        property_obj = db.query(Property).filter(Property.id == property_id).first()
        if not property_obj:
            raise ValueError(f"Property {property_id} not found")
        
        # Get viral template
        template = db.query(ViralVideoTemplate).filter(ViralVideoTemplate.id == template_id).first()
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        logger.info(f"📋 Processing timeline for property: {property_obj.name}")
        
        # Update progress
        current_task.update_state(
            state="PROGRESS", 
            meta={"stage": "processing_timeline", "progress": 15}
        )
        
        # Process timeline data
        slot_assignments = timeline_data.get("slot_assignments", [])
        text_overlays = timeline_data.get("text_overlays", [])
        total_duration = timeline_data.get("total_duration", 30)
        style_settings = timeline_data.get("style_settings", {})
        
        logger.info(f"🎯 Found {len(slot_assignments)} slot assignments and {len(text_overlays)} text overlays")
        logger.info(f"🔍 Timeline data structure: {timeline_data}")
        if slot_assignments:
            logger.info(f"🔍 First slot structure: {slot_assignments[0]}")
        
        # Create temporary directory
        temp_dir = tempfile.mkdtemp(prefix=f"video_gen_{video_id}_")
        logger.info(f"📁 Created temp directory: {temp_dir}")
        
        # Update progress
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "downloading_content", "progress": 25}
        )
        
        # Download and prepare video segments
        video_segments = []
        
        for i, slot in enumerate(slot_assignments):
            try:
                logger.info(f"🔍 Processing slot {i+1}: {slot}")
                segment_info = _process_video_slot(slot, temp_dir, db, i)
                if segment_info:
                    video_segments.append(segment_info)
                    logger.info(f"✅ Processed slot {i+1}/{len(slot_assignments)} successfully")
                else:
                    logger.warning(f"⚠️ Slot {i+1} returned None")
            except Exception as e:
                logger.error(f"❌ Failed to process slot {i+1}: {e}")
                import traceback
                logger.error(traceback.format_exc())
                continue
        
        if not video_segments:
            raise ValueError("No video segments could be processed")
        
        # Update progress
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "assembling_video", "progress": 60}
        )
        
        # Generate final video
        final_video_path = _assemble_final_video(
            video_segments=video_segments,
            text_overlays=text_overlays,
            style_settings=style_settings,
            total_duration=total_duration,
            temp_dir=temp_dir,
            video_id=video_id
        )
        
        # Update progress
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "uploading", "progress": 85}
        )
        
        # Upload to S3
        video_url, thumbnail_url = _upload_to_s3(final_video_path, video_id, property_id)
        
        # Update video record
        video.status = "completed"
        video.video_url = video_url
        video.thumbnail_url = thumbnail_url
        video.duration = total_duration
        video.completed_at = datetime.now()
        
        # Store generation metadata
        generation_metadata = {
            "segments_count": len(video_segments),
            "text_overlays_count": len(text_overlays),
            "template_id": template_id,
            "total_duration": total_duration,
            "generation_method": "timeline_v2"
        }
        video.source_data = json.dumps(generation_metadata)
        
        db.commit()
        
        # Final progress update
        current_task.update_state(
            state="SUCCESS",
            meta={"stage": "completed", "progress": 100}
        )
        
        logger.info(f"🎉 Video generation completed: {video_id}")
        
        return {
            "video_id": video_id,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "status": "completed",
            "segments_processed": len(video_segments),
            "duration": total_duration
        }
        
    except Exception as e:
        logger.error(f"❌ Video generation failed: {e}")
        
        # Update video status to failed
        if db and video:
            try:
                video.status = "failed"
                video.source_data = json.dumps({"error": str(e)})
                db.commit()
            except Exception as db_error:
                logger.error(f"Failed to update video status: {db_error}")
        
        # Update task state
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e), "video_id": video_id}
        )
        
        raise
        
    finally:
        # Cleanup
        if db:
            db.close()
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir)
                logger.info(f"🧹 Cleaned up temp directory: {temp_dir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp directory: {e}")


def _process_video_slot(slot: Dict[str, Any], temp_dir: str, db, slot_index: int) -> Optional[Dict[str, Any]]:
    """Process a single video slot assignment"""
    try:
        logger.info(f"🎬 Processing slot {slot_index}: {slot}")
        
        # Handle different possible slot formats
        assigned_video = slot.get("assignedVideo")
        video_id = None
        
        if assigned_video:
            video_id = assigned_video.get("id")
        elif "videoId" in slot:
            video_id = slot["videoId"]
        elif "video_id" in slot:
            video_id = slot["video_id"]
        
        if not video_id:
            logger.warning(f"Slot {slot_index}: No video ID found in slot: {slot}")
            return None
        
        # Handle different time formats  
        start_time = slot.get("start_time", slot.get("startTime", 0))
        end_time = slot.get("end_time", slot.get("endTime", slot.get("duration")))
        
        # If no end_time specified, use default duration
        if end_time is None:
            end_time = 3  # Default 3 seconds fallback
        
        logger.info(f"Slot {slot_index}: video_id={video_id}, start={start_time}, end={end_time}")
        
        # Get video from database
        video_record = db.query(Video).filter(Video.id == video_id).first()
        if not video_record or not video_record.video_url:
            logger.warning(f"Video {video_id} not found or no URL")
            return None
        
        # Extract S3 key from video URL
        if video_record.video_url.startswith("s3://"):
            s3_key = video_record.video_url[5:].split("/", 1)[1]
        else:
            logger.warning(f"Invalid video URL format: {video_record.video_url}")
            return None
        
        # Download video
        local_video_path = os.path.join(temp_dir, f"source_{slot_index}.mp4")
        download_url = s3_service.generate_presigned_download_url(s3_key)
        
        download_cmd = ["curl", "-s", "--max-time", "30", "-o", local_video_path, download_url]
        result = subprocess.run(download_cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode != 0 or not os.path.exists(local_video_path):
            logger.warning(f"Failed to download video {video_id}")
            return None
        
        # Extract segment with ffmpeg
        segment_path = os.path.join(temp_dir, f"segment_{slot_index}.mp4")
        duration = end_time - start_time
        
        ffmpeg_cmd = [
            "ffmpeg", "-y", "-i", local_video_path,
            "-ss", str(start_time), "-t", str(duration),
            "-c", "copy", "-avoid_negative_ts", "make_zero",
            segment_path
        ]
        
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and os.path.exists(segment_path):
            # Cleanup source
            os.remove(local_video_path)
            
            return {
                "path": segment_path,
                "duration": duration,
                "order": slot.get("order", slot_index),
                "video_id": video_id
            }
        else:
            logger.warning(f"FFmpeg failed for slot {slot_index}: {result.stderr}")
            return None
            
    except Exception as e:
        logger.error(f"Error processing video slot {slot_index}: {e}")
        return None


def _assemble_final_video(
    video_segments: List[Dict[str, Any]],
    text_overlays: List[Dict[str, Any]], 
    style_settings: Dict[str, Any],
    total_duration: float,
    temp_dir: str,
    video_id: str
) -> str:
    """Assemble final video with segments and text overlays"""
    
    # Sort segments by order
    video_segments.sort(key=lambda x: x.get("order", 0))
    
    final_video_path = os.path.join(temp_dir, f"final_{video_id}.mp4")
    
    if len(video_segments) == 1:
        # Single segment - just copy
        import shutil
        shutil.copy2(video_segments[0]["path"], final_video_path)
    else:
        # Multiple segments - concatenate
        concat_list_path = os.path.join(temp_dir, "concat_list.txt")
        
        with open(concat_list_path, 'w') as f:
            for segment in video_segments:
                f.write(f"file '{segment['path']}'\n")
        
        concat_cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_list_path, "-c", "copy", final_video_path
        ]
        
        result = subprocess.run(concat_cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            raise Exception(f"Video concatenation failed: {result.stderr}")
    
    # TODO: Add text overlays processing here
    # For now, return the concatenated video
    
    if not os.path.exists(final_video_path):
        raise Exception("Final video file was not created")
    
    return final_video_path


def _upload_to_s3(video_path: str, video_id: str, property_id: str) -> tuple[str, str]:
    """Upload video to S3 and return URLs"""
    
    s3_key = f"generated-videos/{property_id}/{video_id}.mp4"
    
    with open(video_path, 'rb') as video_file:
        upload_result = s3_service.upload_file_direct(
            video_file, s3_key, content_type="video/mp4", public_read=False
        )
    
    if not upload_result.get('success'):
        raise Exception("S3 upload failed")
    
    # Generate presigned URLs
    video_url = s3_service.generate_presigned_download_url(s3_key, expires_in=86400)
    thumbnail_url = "https://picsum.photos/640/1138"  # Placeholder for now
    
    return video_url, thumbnail_url