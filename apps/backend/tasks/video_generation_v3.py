"""
Video Generation System v3 - Complete Rebuild
Proper timeline-based video assembly with viral template structure
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
from core.config import settings
from models.video import Video
from models.property import Property
from models.viral_video_template import ViralVideoTemplate
from services.s3_service import s3_service

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def generate_video_from_timeline_v3(
    self,
    video_id: str,
    property_id: str,
    user_id: str,
    timeline_data: Dict[str, Any],
    template_id: str,
    language: str = "fr"
) -> Dict[str, Any]:
    """
    Generate video from timeline with proper viral template structure
    
    WORKFLOW:
    1. Get viral template script (clips with durations and descriptions)
    2. Get slot assignments (which video goes in which slot)
    3. For each clip in template: download assigned video, extract segment based on clip duration
    4. Concatenate all segments in order
    5. Add text overlays if any
    6. Upload final video
    """
    
    db = None
    temp_dir = None
    video = None
    
    try:
        logger.info(f"🎬 Starting video generation v3: {video_id}")
        
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
        logger.info(f"📝 Using template: {template.title}")
        
        # Parse timeline data
        slot_assignments = timeline_data.get("slot_assignments", [])
        text_overlays = timeline_data.get("text_overlays", [])
        total_duration = timeline_data.get("total_duration", 30)
        
        logger.info(f"🎯 Found {len(slot_assignments)} slot assignments")
        logger.info(f"📊 Timeline data: {timeline_data}")
        
        # Parse viral template script to get clip structure
        if not template.script:
            raise ValueError(f"Template {template_id} has no script")
        
        try:
            script_data = json.loads(template.script)
            template_clips = script_data.get("clips", [])
            template_texts = script_data.get("texts", [])
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid template script JSON: {e}")
        
        if not template_clips:
            raise ValueError(f"Template {template_id} has no clips in script")
        
        logger.info(f"📝 Template has {len(template_clips)} clips")
        for i, clip in enumerate(template_clips):
            logger.info(f"  Clip {i+1}: {clip.get('duration', 'no duration')}s - {clip.get('description', 'no description')[:50]}...")
        
        # Create slot mapping: slotId -> videoId
        slot_mapping = {}
        for assignment in slot_assignments:
            slot_id = assignment.get("slotId")
            video_id_assigned = assignment.get("videoId")
            if slot_id and video_id_assigned:
                slot_mapping[slot_id] = video_id_assigned
        
        logger.info(f"🔗 Slot mapping: {slot_mapping}")
        
        # Create temporary directory
        temp_dir = tempfile.mkdtemp(prefix=f"video_gen_v3_{video_id}_")
        logger.info(f"📁 Created temp directory: {temp_dir}")
        
        # Update progress
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "processing_clips", "progress": 25}
        )
        
        # Process each clip according to template order
        video_segments = []
        for i, clip in enumerate(template_clips):
            try:
                logger.info(f"🎬 Processing clip {i+1}/{len(template_clips)}")
                
                # Get assigned video for this slot
                slot_id = f"slot_{i}"
                assigned_video_id = slot_mapping.get(slot_id)
                
                if not assigned_video_id:
                    logger.warning(f"No video assigned to {slot_id}, skipping clip {i+1}")
                    continue
                
                # Get clip duration from template
                clip_duration = clip.get("duration", 3.0)
                clip_description = clip.get("description", "No description")
                
                logger.info(f"📏 Clip {i+1}: {clip_duration}s - {assigned_video_id}")
                logger.info(f"📖 Description: {clip_description}")
                
                # Process this video segment
                segment_info = _process_video_segment_v3(
                    assigned_video_id, clip_duration, temp_dir, db, i
                )
                
                if segment_info:
                    video_segments.append(segment_info)
                    logger.info(f"✅ Processed clip {i+1} successfully")
                else:
                    logger.warning(f"⚠️ Failed to process clip {i+1}")
                    
            except Exception as e:
                logger.error(f"❌ Error processing clip {i+1}: {e}")
                continue
        
        if not video_segments:
            raise ValueError("No video segments could be processed")
        
        logger.info(f"🎞️ Successfully processed {len(video_segments)} segments")
        
        # Update progress
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "assembling_video", "progress": 60}
        )
        
        # Assemble final video
        final_video_path = _assemble_final_video_v3(
            video_segments=video_segments,
            text_overlays=text_overlays,
            template_texts=template_texts,
            temp_dir=temp_dir,
            video_id=video_id
        )
        
        # Update progress
        current_task.update_state(
            state="PROGRESS",
            meta={"stage": "uploading", "progress": 85}
        )
        
        # Upload to S3
        logger.info(f"📤 About to upload video to S3: {final_video_path}")
        video_url, thumbnail_url = _upload_to_s3_v3(final_video_path, video_id, property_id)
        logger.info(f"✅ Upload completed. Video URL: {video_url}, Thumbnail URL: {thumbnail_url}")
        
        # Calculate total duration
        actual_duration = sum(seg.get("duration", 0) for seg in video_segments)
        
        # Update video record
        video.status = "completed"
        video.video_url = video_url
        video.thumbnail_url = thumbnail_url
        video.duration = actual_duration
        video.completed_at = datetime.now()
        
        # Store generation metadata
        generation_metadata = {
            "segments_count": len(video_segments),
            "text_overlays_count": len(text_overlays),
            "template_id": template_id,
            "actual_duration": actual_duration,
            "expected_duration": sum(clip.get("duration", 0) for clip in template_clips),
            "generation_method": "timeline_v3",
            "segments": [{"video_id": seg.get("video_id"), "duration": seg.get("duration")} for seg in video_segments]
        }
        video.source_data = json.dumps(generation_metadata)
        
        # Generate AI description and add Instagram audio URL
        _post_process_video_metadata(video_id, template_id, db)
        
        db.commit()
        
        # Final progress update
        current_task.update_state(
            state="SUCCESS",
            meta={"stage": "completed", "progress": 100}
        )
        
        logger.info(f"🎉 Video generation v3 completed: {video_id}")
        logger.info(f"📊 Duration: {actual_duration}s, Segments: {len(video_segments)}")
        
        return {
            "video_id": video_id,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "status": "completed",
            "segments_processed": len(video_segments),
            "duration": actual_duration
        }
        
    except Exception as e:
        logger.error(f"❌ Video generation v3 failed: {e}")
        
        # Update video status to failed
        if db and video:
            try:
                video.status = "failed"
                video.source_data = json.dumps({"error": str(e), "generation_method": "timeline_v3"})
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


def _process_video_segment_v3(
    video_id: str, 
    duration: float, 
    temp_dir: str, 
    db, 
    segment_index: int
) -> Optional[Dict[str, Any]]:
    """Process a single video segment according to viral template duration"""
    try:
        logger.info(f"🎬 Processing segment {segment_index}: video={video_id}, duration={duration}s")
        
        # Get video from database
        video_record = db.query(Video).filter(Video.id == video_id).first()
        if not video_record or not video_record.video_url:
            logger.warning(f"Video {video_id} not found or no URL")
            return None
        
        # Extract S3 key from video URL
        if video_record.video_url.startswith("s3://"):
            # Format: s3://bucket-name/key -> extract key part
            url_without_protocol = video_record.video_url[5:]  # Remove "s3://"
            s3_key = url_without_protocol.split("/", 1)[1]  # Remove bucket name, keep key
            logger.info(f"📦 Extracted S3 key: {s3_key} from URL: {video_record.video_url}")
        else:
            logger.warning(f"Invalid video URL format: {video_record.video_url}")
            return None
        
        # Download video (adapt based on storage backend)
        local_video_path = os.path.join(temp_dir, f"source_{segment_index}.mp4")
        
        logger.info(f"🔧 Storage backend: {settings.STORAGE_BACKEND}")
        
        if settings.STORAGE_BACKEND == "s3":
            download_url = s3_service.generate_presigned_download_url(s3_key)
            
            download_cmd = ["curl", "-s", "--max-time", "60", "-o", local_video_path, download_url]
            result = subprocess.run(download_cmd, capture_output=True, text=True, timeout=120)
            
            if result.returncode != 0 or not os.path.exists(local_video_path):
                logger.warning(f"Failed to download video {video_id}: {result.stderr}")
                return None
        else:
            # Local storage - copy file directly
            local_source_path = os.path.join("uploads", s3_key)
            
            if not os.path.exists(local_source_path):
                logger.warning(f"Local file not found: {local_source_path}")
                return None
            
            import shutil
            shutil.copy2(local_source_path, local_video_path)
        
        # Extract segment with specified duration from the beginning
        segment_path = os.path.join(temp_dir, f"segment_{segment_index}.mp4")
        
        ffmpeg_cmd = [
            "ffmpeg", "-y", "-i", local_video_path,
            "-ss", "0", "-t", str(duration),
            "-c:v", "libx264", "-c:a", "aac", 
            "-r", "30", "-crf", "23",
            "-avoid_negative_ts", "make_zero",
            segment_path
        ]
        
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0 and os.path.exists(segment_path):
            # Cleanup source
            os.remove(local_video_path)
            
            return {
                "path": segment_path,
                "duration": duration,
                "order": segment_index,
                "video_id": video_id
            }
        else:
            logger.warning(f"FFmpeg failed for segment {segment_index}: {result.stderr}")
            return None
            
    except Exception as e:
        logger.error(f"Error processing video segment {segment_index}: {e}")
        return None


def _assemble_final_video_v3(
    video_segments: List[Dict[str, Any]],
    text_overlays: List[Dict[str, Any]],
    template_texts: List[Dict[str, Any]],
    temp_dir: str,
    video_id: str
) -> str:
    """Assemble final video with proper concatenation"""
    
    # Sort segments by order
    video_segments.sort(key=lambda x: x.get("order", 0))
    
    final_video_path = os.path.join(temp_dir, f"final_{video_id}.mp4")
    
    if len(video_segments) == 1:
        # Single segment - just copy
        import shutil
        shutil.copy2(video_segments[0]["path"], final_video_path)
        logger.info(f"📹 Single segment copied to final video")
    else:
        # Multiple segments - concatenate with proper encoding
        concat_list_path = os.path.join(temp_dir, "concat_list.txt")
        
        with open(concat_list_path, 'w', encoding='utf-8') as f:
            for segment in video_segments:
                # Escape path properly for FFmpeg
                path = segment['path'].replace("'", "\\'")
                f.write(f"file '{path}'\n")
        
        # Use concat demuxer for better performance
        concat_cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_list_path,
            "-c:v", "libx264", "-c:a", "aac",
            "-r", "30", "-crf", "23",
            final_video_path
        ]
        
        result = subprocess.run(concat_cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0:
            logger.error(f"Concatenation failed: {result.stderr}")
            raise Exception(f"Video concatenation failed: {result.stderr}")
        
        logger.info(f"📹 Concatenated {len(video_segments)} segments successfully")
    
    # Apply text overlays if any are provided (only custom text overlays, not template texts)
    if text_overlays:
        logger.info(f"📝 Applying {len(text_overlays)} custom text overlays")
        final_video_path = _apply_text_overlays_v3(
            final_video_path, text_overlays, [], temp_dir, video_id
        )
    else:
        logger.info("📝 No text overlays to apply")
    
    if not os.path.exists(final_video_path):
        raise Exception("Final video file was not created")
    
    return final_video_path


def _apply_text_overlays_v3(
    input_video_path: str,
    text_overlays: List[Dict[str, Any]],
    template_texts: List[Dict[str, Any]],
    temp_dir: str,
    video_id: str
) -> str:
    """Apply text overlays to video using FFmpeg drawtext filters"""
    try:
        output_video_path = os.path.join(temp_dir, f"final_with_text_{video_id}.mp4")
        
        # Combine all text overlays
        all_texts = []
        
        # Process custom text overlays from timeline
        for text_overlay in text_overlays:
            all_texts.append({
                "content": text_overlay.get("content", ""),
                "start_time": text_overlay.get("start_time", 0),
                "end_time": text_overlay.get("end_time", 3),
                "x": text_overlay.get("position", {}).get("x", 50) / 100.0,  # Convert % to 0-1
                "y": text_overlay.get("position", {}).get("y", 80) / 100.0,  # Convert % to 0-1
                "style": text_overlay.get("style", {})
            })
        
        # Skip template texts - only use custom text overlays from timeline editor
        
        if not all_texts:
            logger.info("📝 No text content to apply")
            return input_video_path
        
        # Build FFmpeg drawtext filters
        text_filters = []
        for i, text_info in enumerate(all_texts):
            content = text_info.get("content", "").strip()
            if not content:
                continue
                
            start_time = text_info.get("start_time", 0)
            end_time = text_info.get("end_time", start_time + 3)
            x_rel = text_info.get("x", 0.5)
            y_rel = text_info.get("y", 0.8)
            style = text_info.get("style", {})
            
            # Font configuration
            font_file = "/System/Library/Fonts/Helvetica.ttc"  # Default font
            font_size = int(style.get("font_size", 48))  # Default size
            font_color = style.get("color", "#FFFFFF")
            
            # Convert color format
            if font_color.startswith("#"):
                font_color = f"0x{font_color[1:]}"
            else:
                font_color = "white"
            
            # Position calculation - Adjust to match frontend preview better
            # Frontend uses transform: translate(-50%, -50%) which centers text at coordinates
            # User feedback: text needs to be more left and more down
            x_offset = int(x_rel * 1920) if x_rel < 1 else int(1920 - 10)
            y_offset = int(y_rel * 1080) if y_rel < 1 else int(1080 - 50)
            
            # Adjust positioning to match preview better - move text left and down
            # Move significantly more left and down based on user feedback
            x_pos = f"({max(10, min(x_offset, 1910))}-text_w*0.75)"  # More left
            y_pos = f"({max(10, min(y_offset, 1070))}-text_h*0.25)"  # More down
            
            # Debug logging
            logger.info(f"📍 Text positioning: '{content}' at ({x_rel:.2f}, {y_rel:.2f}) -> pixel ({x_offset}, {y_offset}) -> FFmpeg ({x_pos}, {y_pos})")
            
            # Escape text for FFmpeg
            safe_text = (content
                        .replace("\\", "\\\\")
                        .replace("'", "\\'")
                        .replace('"', '\\"')
                        .replace(":", "\\:")
                        .replace("=", "\\=")
                        .replace(",", "\\,")
                        .replace("[", "\\[")
                        .replace("]", "\\]"))
            
            # Create drawtext filter
            # Get text alignment for multiline text
            text_align = text_info.get("style", {}).get("text_align", "center")
            alignment_map = {"left": "left", "center": "center", "right": "right"}
            text_alignment = alignment_map.get(text_align, "center")
            
            text_filter = f"drawtext=text='{safe_text}':fontfile={font_file}:fontsize={font_size}:fontcolor={font_color}:x={x_pos}:y={y_pos}"
            
            # Add text effects based on style
            if style.get("shadow", True):  # Default shadow on
                text_filter += ":shadowcolor=black@0.8:shadowx=2:shadowy=2"
            
            if style.get("outline", False):
                text_filter += ":bordercolor=black:borderw=2"
            
            if style.get("background", False):
                text_filter += ":box=1:boxcolor=black@0.5:boxborderw=10"
            
            # Add timing
            text_filter += f":enable='between(t,{start_time},{end_time})'"
            text_filters.append(text_filter)
        
        if not text_filters:
            logger.info("📝 No valid text filters created")
            return input_video_path
        
        logger.info(f"🔧 Applying {len(text_filters)} text overlays with FFmpeg...")
        
        # Apply text overlays using FFmpeg
        ffmpeg_cmd = [
            'ffmpeg', '-y',
            '-i', input_video_path,
            '-vf', ','.join(text_filters),
            '-c:a', 'copy',  # Keep audio unchanged
            '-c:v', 'libx264',  # Re-encode video for text overlays
            '-preset', 'fast',
            '-crf', '23',
            '-movflags', '+faststart',
            output_video_path
        ]
        
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0 or not os.path.exists(output_video_path):
            logger.error(f"❌ Text overlay application failed: {result.stderr}")
            logger.info("🔄 Falling back to video without text overlays")
            return input_video_path
        else:
            logger.info(f"✅ Successfully applied {len(text_filters)} text overlays")
            return output_video_path
            
    except Exception as e:
        logger.error(f"❌ Error applying text overlays: {e}")
        return input_video_path


def _upload_to_s3_v3(video_path: str, video_id: str, property_id: str) -> tuple[str, str]:
    """Upload video to S3 and return URLs"""
    
    s3_key = f"generated-videos/{property_id}/{video_id}.mp4"
    
    with open(video_path, 'rb') as video_file:
        upload_result = s3_service.upload_file_direct(
            video_file, s3_key, content_type="video/mp4", public_read=False
        )
    
    if not upload_result.get('success'):
        raise Exception("S3 upload failed")
    
    # Generate real thumbnail using the existing robust function
    logger.info(f"🖼️ Generating thumbnail for video: {video_path}")
    
    try:
        from tasks.video_processing_tasks import _generate_video_thumbnail
        temp_dir = os.path.dirname(video_path)
        thumbnail_url = _generate_video_thumbnail(video_path, video_id, temp_dir)
        
        if thumbnail_url:
            logger.info(f"✅ Generated thumbnail successfully: {thumbnail_url}")
        else:
            logger.warning("⚠️ Failed to generate thumbnail, using fallback")
            thumbnail_url = "https://picsum.photos/640/1138"  # Fallback
            
    except Exception as e:
        logger.error(f"❌ Failed to generate thumbnail: {e}")
        thumbnail_url = "https://picsum.photos/640/1138"  # Fallback
    
    # Generate presigned URLs
    video_url = s3_service.generate_presigned_download_url(s3_key, expires_in=86400)
    
    return video_url, thumbnail_url


def _post_process_video_metadata(video_id: str, template_id: str, db):
    """Generate AI description and add Instagram audio URL after video completion"""
    try:
        from models.viral_video_template import ViralVideoTemplate
        from models.video import Video
        from models.property import Property
        
        logger.info(f"🤖 Post-processing video metadata for {video_id}")
        
        # Get video and related data
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            logger.error(f"Video {video_id} not found for post-processing")
            return
            
        property_obj = db.query(Property).filter(Property.id == video.property_id).first()
        if not property_obj:
            logger.warning(f"Property not found for video {video_id}")
            return
        
        # Get viral template for Instagram audio URL
        if template_id:
            template = db.query(ViralVideoTemplate).filter(ViralVideoTemplate.id == template_id).first()
            if template and template.video_link:
                # Store Instagram audio URL
                video.instagram_audio_url = template.video_link
                logger.info(f"📱 Added Instagram audio URL: {template.video_link}")
        
        # Generate AI description using Groq
        try:
            from services.groq_service import groq_service
            
            # Parse original user input from source_data
            source_data = json.loads(video.source_data) if video.source_data else {}
            user_description = source_data.get("user_input", "")
            
            # Generate description with Groq AI using ALL property data
            ai_description = groq_service.generate_instagram_description(
                property_obj=property_obj,
                user_description=user_description
            )
            
            video.ai_description = ai_description
            logger.info(f"🤖 Generated Groq AI description for {property_obj.name}")
                
        except Exception as e:
            logger.error(f"❌ Error generating AI description: {e}")
            # Set a basic fallback
            city_tag = f"#{property_obj.city.lower().replace(' ', '').replace('-', '')}" if property_obj.city else "#voyage"
            video.ai_description = f"✨ Découvrez {property_obj.name}! 🏨\n📍 {property_obj.city}\n#travel #hotel {city_tag}"
        
        db.commit()
        logger.info(f"✅ Video metadata post-processing completed for {video_id}")
        
    except Exception as e:
        logger.error(f"❌ Error in post-processing video metadata: {e}")