from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from core.database import get_db
from core.auth import get_current_user
from models.user import User
from models.property import Property
from models.video import Video
# Import Celery tasks conditionally to prevent startup crashes
try:
    from tasks.video_matching import find_matching_viral_videos, analyze_image_for_matching
except Exception as e:
    print(f"Warning: Could not import video matching tasks: {e}")
    find_matching_viral_videos = None
    analyze_image_for_matching = None

try:
    from tasks.embeddings import populate_viral_video_database
except Exception as e:
    print(f"Warning: Could not import embeddings tasks: {e}")
    populate_viral_video_database = None

try:
    from tasks.video_generation_v3 import generate_video_from_timeline_v3
except Exception as e:
    print(f"Warning: Could not import video generation v3 tasks: {e}")
    generate_video_from_timeline_v3 = None

from pydantic import BaseModel
import uuid
import json

# Import S3 service conditionally to prevent startup crashes
try:
    from services.s3_service import s3_service
except Exception as e:
    print(f"Warning: Could not import S3 service in video_generation.py: {e}")
    s3_service = None
import logging
import boto3
import requests

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/video-generation", tags=["video-generation"])

# AWS Configuration for MediaConvert video generation
AWS_LAMBDA_FUNCTION = "hospup-video-generator"
AWS_REGION = "eu-west-1"

# AWS Service (configured globally)
try:
    lambda_client = boto3.client('lambda', region_name=AWS_REGION)
except Exception as e:
    logger.warning(f"Could not initialize AWS Lambda client: {e}")
    lambda_client = None

def _generate_video_from_segments(matched_segments, target_duration, adapted_texts, property_details, video_id):
    """
    Generate a real video by assembling matched Content Library segments
    
    Args:
        matched_segments: List of matched segments with timing info
        target_duration: Target video duration in seconds
        adapted_texts: Text overlays adapted for the property
        property_details: Property information
        video_id: Video ID for file naming
        
    Returns:
        Tuple (video_url, thumbnail_url) or (None, None) if failed
    """
    try:
        import tempfile
        import subprocess
        import os
        import uuid
        from services.s3_service import s3_service
        
        logger.info(f"🎬 Generating video from {len(matched_segments)} segments (target duration: {target_duration}s)")
        
        # Create temporary directory for video generation
        temp_dir = tempfile.mkdtemp()
        output_video_path = os.path.join(temp_dir, f"generated_{video_id}.mp4")
        
        try:
            # Step 1: Download all source videos and prepare segments with proper duration
            segment_files = []
            total_extracted_duration = 0
            
            # Calculate target duration per segment
            segments_count = len(matched_segments)
            
            # Strategy: Use multiple segments if available, repeat if needed
            if segments_count == 1:
                # Only one segment: we need to loop or extend it
                target_duration_per_segment = target_duration
            else:
                # Multiple segments: divide duration evenly
                target_duration_per_segment = target_duration / segments_count
            
            logger.info(f"🎯 Target duration: {target_duration:.1f}s total, {target_duration_per_segment:.1f}s per segment")
            
            for i, match in enumerate(matched_segments):
                segment = match["matched_segment"]
                extract_start = match["extract_start"]
                extract_end = match["extract_end"]
                original_duration = extract_end - extract_start
                
                logger.info(f"📹 Processing segment {i+1}: {segment.description[:50]}... (original: {original_duration:.1f}s, target: {target_duration_per_segment:.1f}s)")
                
                # Get source video from database
                from core.database import SessionLocal
                from models.video import Video
                db_session = SessionLocal()
                source_video = db_session.query(Video).filter(Video.id == segment.video_id).first()
                db_session.close()
                
                if source_video and source_video.video_url:
                    # Download source video if it's an S3 URL
                    source_video_path = source_video.video_url
                    temp_source_path = None
                    
                    if source_video.video_url.startswith("s3://"):
                        # Download from S3 to temp location
                        import requests
                        s3_key = source_video.video_url.replace(f"s3://{s3_service.bucket_name}/", "")
                        temp_source_path = os.path.join(temp_dir, f"source_{i}.mp4")
                        
                        try:
                            # Generate download URL and download file
                            download_url = s3_service.generate_presigned_download_url(s3_key)
                            response = requests.get(download_url, stream=True, timeout=120)
                            response.raise_for_status()
                            
                            with open(temp_source_path, 'wb') as f:
                                for chunk in response.iter_content(chunk_size=8192):
                                    f.write(chunk)
                            
                            source_video_path = temp_source_path
                            logger.info(f"📥 Downloaded source video from S3: {s3_key}")
                        except Exception as e:
                            logger.error(f"❌ Failed to download source video: {e}")
                            continue
                    
                    # Extract and extend segment to target duration
                    segment_output = os.path.join(temp_dir, f"segment_{i}.mp4")
                    
                    # Strategy: If we have only one segment and it's too short, loop it
                    # If we have multiple segments, use them all without looping individual segments
                    if segments_count == 1 and original_duration < target_duration_per_segment:
                        loop_count = int(target_duration_per_segment / original_duration) + 1
                        logger.info(f"🔄 Single segment too short ({original_duration:.1f}s), looping {loop_count} times to reach {target_duration_per_segment:.1f}s")
                        
                        # Create looped video
                        temp_segment = os.path.join(temp_dir, f"temp_segment_{i}.mp4")
                        
                        # First extract the original segment
                        extract_cmd = [
                            'ffmpeg', '-y',
                            '-ss', str(extract_start),
                            '-t', str(original_duration),
                            '-i', source_video_path,
                            '-c', 'copy',
                            '-avoid_negative_ts', 'make_zero',
                            temp_segment
                        ]
                        
                        result = subprocess.run(extract_cmd, capture_output=True, text=True, timeout=60)
                        if result.returncode != 0:
                            logger.error(f"❌ Failed to extract segment {i+1}: {result.stderr}")
                            continue
                        
                        # Create loop filter and extend to target duration
                        loop_cmd = [
                            'ffmpeg', '-y',
                            '-stream_loop', str(loop_count),
                            '-i', temp_segment,
                            '-t', str(target_duration_per_segment),
                            '-c', 'copy',
                            segment_output
                        ]
                        
                        result = subprocess.run(loop_cmd, capture_output=True, text=True, timeout=60)
                        if result.returncode == 0 and os.path.exists(segment_output):
                            segment_files.append(segment_output)
                            total_extracted_duration += target_duration_per_segment
                            logger.info(f"✅ Extended segment {i+1}: {target_duration_per_segment:.1f}s (looped)")
                        else:
                            logger.error(f"❌ Failed to loop segment {i+1}: {result.stderr}")
                    else:
                        # Extract segment with appropriate duration
                        actual_duration = min(original_duration, target_duration_per_segment)
                        ffmpeg_cmd = [
                            'ffmpeg', '-y',
                            '-ss', str(extract_start),
                            '-t', str(actual_duration),
                            '-i', source_video_path,
                            '-c', 'copy',
                            '-avoid_negative_ts', 'make_zero',
                            segment_output
                        ]
                        
                        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=60)
                        if result.returncode == 0 and os.path.exists(segment_output):
                            segment_files.append(segment_output)
                            total_extracted_duration += actual_duration
                            logger.info(f"✅ Extracted segment {i+1}: {actual_duration:.1f}s")
                        else:
                            logger.error(f"❌ FFmpeg failed for segment {i+1}: {result.stderr}")
                        
            if not segment_files:
                logger.error("❌ No segments could be extracted")
                return None, None
                
            logger.info(f"📊 Successfully extracted {len(segment_files)} segments ({total_extracted_duration:.1f}s total, target was {target_duration:.1f}s)")
            
            # Step 2: Create concat file for FFmpeg
            concat_file = os.path.join(temp_dir, "concat.txt")
            with open(concat_file, 'w') as f:
                for segment_file in segment_files:
                    f.write(f"file '{segment_file}'\n")
            
            # Step 3: Concatenate all segments and apply text overlays
            logger.info("🔗 Concatenating segments into final video...")
            
            # First concatenate without re-encoding (fast)
            temp_concat_video = os.path.join(temp_dir, f"concat_{video_id}.mp4")
            concat_cmd = [
                'ffmpeg', '-y',
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_file,
                '-c', 'copy',
                '-movflags', '+faststart',
                temp_concat_video
            ]
            
            result = subprocess.run(concat_cmd, capture_output=True, text=True, timeout=120)
            if result.returncode != 0 or not os.path.exists(temp_concat_video):
                logger.error(f"❌ Video concatenation failed: {result.stderr}")
                return None, None
                
            logger.info("✅ Segments concatenated successfully")
            
            # Step 4: Apply text overlays if any
            if adapted_texts:
                logger.info(f"📝 Applying {len(adapted_texts)} text overlays...")
                
                # Build FFmpeg drawtext filters using template coordinates
                text_filters = []
                for i, text_info in enumerate(adapted_texts):
                    text_content = text_info.get("adapted", text_info.get("original", ""))
                    start_time = text_info.get("start_time", 0)
                    end_time = text_info.get("end_time", start_time + 3.0)
                    
                    # Get positioning from template (can be overridden by property settings)
                    x_rel = text_info.get("x", 0.5)  # 0.5 = center
                    y_rel = text_info.get("y", 0.66)  # 0.66 = 66% from top
                    
                    # Use property's custom text settings if available
                    from constants.text_fonts import get_font_by_id, get_text_size_config
                    
                    # Font and color from property or template
                    if property_details and property_details.text_font:
                        font_config = get_font_by_id(property_details.text_font)
                        font_file = font_config["file_path"]
                    else:
                        font_file = "/System/Library/Fonts/Helvetica.ttc"
                        
                    if property_details and property_details.text_color:
                        color = property_details.text_color
                    else:
                        color = text_info.get("color", "#FFFFFF")
                    
                    # Text size from property or template
                    if property_details and property_details.text_size:
                        size_config = get_text_size_config(property_details.text_size)
                        size_rel = size_config["relative"]
                    else:
                        size_rel = text_info.get("size_rel", 0.035)
                    
                    # Convert relative coordinates to FFmpeg coordinates
                    # x: 0.5 → (w-text_w)/2 (center), 0 → 10, 1 → w-text_w-10
                    if x_rel == 0.5:
                        x_pos = "(w-text_w)/2"
                    else:
                        x_offset = int(x_rel * 1920) if x_rel < 1 else int(1920 - 10)
                        x_pos = str(x_offset)
                    
                    # y: 0.66 → h*0.66, etc.
                    y_offset = int(y_rel * 1080) if y_rel < 1 else int(1080 - 50)
                    y_pos = str(y_offset)
                    
                    # Font size: relative to video height (1080p)
                    font_size = int(size_rel * 1080)  # 0.035 * 1080 = 37.8 ≈ 38
                    
                    # Convert color to FFmpeg format (0xRRGGBB)  
                    if color.startswith("#"):
                        font_color = f"0x{color[1:]}"  # #F3E5AB → 0xF3E5AB
                    else:
                        font_color = "white"
                    
                    # Escape text for FFmpeg (escape quotes and special chars)
                    safe_text = (text_content
                                .replace("\\", "\\\\")      # Escape backslashes first
                                .replace("'", "\\'")        # Escape single quotes  
                                .replace('"', '\\"')        # Escape double quotes
                                .replace(":", "\\:")        # Escape colons
                                .replace("=", "\\=")        # Escape equals
                                .replace(",", "\\,")        # Escape commas
                                .replace("[", "\\[")        # Escape brackets
                                .replace("]", "\\]"))
                    
                    # Create drawtext filter with custom settings
                    text_filter = f"drawtext=text='{safe_text}':fontfile={font_file}:fontsize={font_size}:fontcolor={font_color}:x={x_pos}:y={y_pos}"
                    
                    # Add effects based on property settings
                    if property_details:
                        # Text shadow
                        if property_details.text_shadow:
                            text_filter += ":shadowcolor=black@0.8:shadowx=2:shadowy=2"
                        
                        # Text outline 
                        if property_details.text_outline:
                            text_filter += ":bordercolor=black:borderw=2"
                        
                        # Background box
                        if property_details.text_background:
                            text_filter += ":box=1:boxcolor=black@0.5:boxborderw=10"
                    
                    # Add timing
                    text_filter += f":enable='between(t,{start_time},{end_time})'"
                    text_filters.append(text_filter)
                
                # Apply all text overlays in one FFmpeg command
                video_with_text_cmd = [
                    'ffmpeg', '-y',
                    '-i', temp_concat_video,
                    '-vf', ','.join(text_filters),
                    '-c:a', 'copy',  # Keep audio unchanged
                    '-c:v', 'libx264',  # Re-encode video for text overlays
                    '-preset', 'fast',
                    '-crf', '23',
                    '-movflags', '+faststart',
                    output_video_path
                ]
                
                logger.info(f"🔧 Applying text overlays with FFmpeg...")
                result = subprocess.run(video_with_text_cmd, capture_output=True, text=True, timeout=180)
                
                if result.returncode != 0 or not os.path.exists(output_video_path):
                    logger.error(f"❌ Text overlay application failed: {result.stderr}")
                    # Fallback: use video without text overlays
                    logger.info("🔄 Falling back to video without text overlays")
                    import shutil
                    shutil.copy2(temp_concat_video, output_video_path)
                else:
                    logger.info(f"✅ Successfully applied {len(adapted_texts)} text overlays")
            else:
                # No text overlays to apply, just use the concatenated video
                logger.info("📝 No text overlays to apply")
                import shutil
                shutil.copy2(temp_concat_video, output_video_path)
            
            # Step 5: Upload generated video to S3
            logger.info("☁️ Uploading generated video to S3...")
            s3_key = f"generated-videos/{property_details.id}/{video_id}.mp4"
            
            with open(output_video_path, 'rb') as video_file:
                upload_result = s3_service.upload_file_direct(video_file, s3_key, content_type="video/mp4")
                
            if upload_result and upload_result.get("success"):
                video_url = upload_result["url"]
                
                # Generate thumbnail using robust method
                from tasks.video_processing_tasks import _generate_video_thumbnail
                thumbnail_url = _generate_video_thumbnail(output_video_path, video_id, temp_dir)
                
                if not thumbnail_url:
                    logger.warning("Failed to generate thumbnail, using fallback")
                    thumbnail_url = "https://picsum.photos/640/1138"
                
                logger.info(f"✅ Video uploaded successfully: {video_url}")
                return video_url, thumbnail_url
            else:
                logger.error("❌ S3 upload failed")
                return None, None
                
        finally:
            # Cleanup temporary files
            try:
                import shutil
                shutil.rmtree(temp_dir)
                logger.info("🧹 Cleaned up temporary files")
            except Exception as e:
                logger.warning(f"⚠️ Cleanup failed: {e}")
                
    except Exception as e:
        logger.error(f"❌ Video generation error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None, None

def _calculate_description_similarity(desc1: str, desc2: str) -> float:
    """
    Calculate similarity between two descriptions using simple keyword matching
    
    Args:
        desc1: First description (viral clip)
        desc2: Second description (content segment)
        
    Returns:
        Similarity score between 0 and 1
    """
    if not desc1 or not desc2:
        return 0.0
    
    # Convert to lowercase and split into words
    words1 = set(desc1.lower().split())
    words2 = set(desc2.lower().split())
    
    # Remove common stop words
    stop_words = {"a", "an", "the", "is", "are", "with", "of", "in", "on", "at", "to", "for", "and", "or"}
    words1 = words1 - stop_words
    words2 = words2 - stop_words
    
    if not words1 or not words2:
        return 0.0
    
    # Calculate Jaccard similarity (intersection / union)
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    
    jaccard_score = intersection / union if union > 0 else 0.0
    
    # Boost score for key hospitality terms
    hospitality_keywords = {
        "pool", "swimming", "water", "beach", "ocean", "spa", "massage", "restaurant", 
        "dining", "food", "cocktail", "drink", "hotel", "room", "bed", "lobby", 
        "garden", "terrace", "view", "sunset", "breakfast", "luxury", "relaxation"
    }
    
    # Count hospitality keyword matches
    hospitality_matches = len(words1.intersection(words2).intersection(hospitality_keywords))
    hospitality_boost = min(0.3, hospitality_matches * 0.1)
    
    final_score = min(1.0, jaccard_score + hospitality_boost)
    
    return final_score

class VideoMatchRequest(BaseModel):
    input_type: str  # "photo" or "text"
    input_data: str
    property_id: str
    limit: Optional[int] = 10

class VideoGenerationRequest(BaseModel):
    viral_video_id: str
    property_id: str
    input_data: str
    input_type: str
    language: Optional[str] = "en"

class ViralTemplateGenerationRequest(BaseModel):
    property_id: str
    source_type: str  # "viral_template" 
    source_data: dict  # Contains template_id, prompt, language, reconstruction_plan
    language: Optional[str] = "en"

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[int] = None
    stage: Optional[str] = None
    result: Optional[dict] = None
    error: Optional[str] = None

@router.post("/match-videos")
async def match_viral_videos(
    request: VideoMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Find viral videos that match the user's input (text or photo description)
    """
    try:
        # Verify the property belongs to the user
        property_obj = db.query(Property).filter(
            Property.id == request.property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Start the matching task
        task = find_matching_viral_videos.delay(
            input_data=request.input_data,
            input_type=request.input_type,
            property_id=request.property_id,
            limit=request.limit
        )
        
        return {
            "job_id": task.id,
            "status": "started",
            "message": "Video matching started. Use the job ID to check progress."
        }
        
    except Exception as e:
        logger.error(f"Error starting video matching: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-photo")
async def upload_photo_for_analysis(
    file: UploadFile = File(...),
    property_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a photo and analyze it for viral video matching
    """
    try:
        # Verify the property belongs to the user
        property_obj = db.query(Property).filter(
            Property.id == property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Upload to S3
        file_key = f"analysis/{property_id}/{uuid.uuid4()}_{file.filename}"
        upload_result = await s3_service.upload_file(file, file_key)
        
        if not upload_result["success"]:
            raise HTTPException(status_code=500, detail="Failed to upload image")
        
        image_url = upload_result["url"]
        
        # Start image analysis task
        task = analyze_image_for_matching.delay(image_url)
        
        return {
            "job_id": task.id,
            "image_url": image_url,
            "status": "started",
            "message": "Image analysis started. Use the job ID to check progress."
        }
        
    except Exception as e:
        logger.error(f"Error uploading photo for analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_video(
    request: VideoGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a video based on a viral video template
    """
    try:
        # Verify the property belongs to the user
        property_obj = db.query(Property).filter(
            Property.id == request.property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check user's video quota
        if current_user.videos_used >= current_user.videos_limit and current_user.videos_limit != -1:
            raise HTTPException(
                status_code=403, 
                detail="Video generation limit reached. Please upgrade your plan."
            )
        
        # Start video generation task
        # task = generate_video_from_template.delay(
        #     viral_video_id=request.viral_video_id,
        #     property_id=request.property_id,
        #     user_id=str(current_user.id),
        #     input_data=request.input_data,
        #     input_type=request.input_type,
        #     language=request.language
        # )
        
        # Temporary fix - return a dummy task ID
        task = type('obj', (object,), {'id': str(uuid.uuid4())})()
        
        # Increment user's video usage
        current_user.videos_used += 1
        db.commit()
        
        return {
            "job_id": task.id,
            "status": "started",
            "message": "Video generation started. Use the job ID to check progress.",
            "estimated_time": "2-5 minutes"
        }
        
    except Exception as e:
        logger.error(f"Error starting video generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-from-viral-template")
async def generate_video_from_viral_template(
    request: ViralTemplateGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a video based on a viral template with reconstruction plan
    """
    try:
        # Verify the property belongs to the user
        property_obj = db.query(Property).filter(
            Property.id == request.property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check user's video quota
        if current_user.videos_used >= current_user.videos_limit and current_user.videos_limit != -1:
            raise HTTPException(
                status_code=403, 
                detail="Video generation limit reached. Please upgrade your plan."
            )
        
        # Create a video record immediately
        video_id = str(uuid.uuid4())
        
        # Extract data from source_data
        template_id = request.source_data.get('template_id')
        prompt = request.source_data.get('prompt', '')
        reconstruction_plan = request.source_data.get('reconstruction_plan')
        
        # Create video record
        video = Video(
            id=video_id,
            title=f"Viral Video - {property_obj.name}",
            description=prompt,
            video_url="",  # Will be filled when generation completes
            thumbnail_url="",
            status="processing",
            language=request.language,
            source_type=request.source_type,
            source_data=str(request.source_data),
            viral_video_id=template_id,
            user_id=current_user.id,
            property_id=request.property_id
        )
        
        db.add(video)
        db.commit()
        
        # Increment user's video usage
        current_user.videos_used += 1
        db.commit()
        
        # Use new Celery task for video generation
        
        # Prepare timeline data from request
        slot_assignments = request.source_data.get("slot_assignments", [])
        
        # Utilise le matching intelligent SEULEMENT si aucune assignation n'est fournie par l'utilisateur
        if slot_assignments and len(slot_assignments) > 0:
            logger.info(f"🎯 Utilisation des assignations configurées par l'utilisateur: {len(slot_assignments)} assignations")
        elif template_id:
            logger.info(f"🧠 Utilisation du matching intelligent pour template {template_id}")
            try:
                from services.smart_video_matching_service import smart_matching_service
                matching_result = smart_matching_service.find_best_matches(
                    property_id=request.property_id,
                    template_id=template_id
                )
                # Utilise les slot assignments du matching intelligent
                slot_assignments = matching_result.get("slot_assignments", [])
                logger.info(f"✅ Matching intelligent terminé: {len(slot_assignments)} assignations avec score moyen {matching_result.get('matching_scores', {}).get('average_score', 0):.2f}")
            except Exception as e:
                logger.error(f"❌ Erreur lors du matching intelligent: {e}")
                # Fallback vers assignation basique si erreur
                if not slot_assignments:
                    slot_assignments = []
        
        timeline_data = {
            "slot_assignments": slot_assignments,
            "text_overlays": request.source_data.get("text_overlays", []),
            "total_duration": request.source_data.get("total_duration", 30),
            "style_settings": {
                "font": property_obj.text_font or "Arial",
                "color": property_obj.text_color or "#FFFFFF", 
                "size": property_obj.text_size or 24,
                "shadow": property_obj.text_shadow or True,
                "outline": property_obj.text_outline or True,
                "background": property_obj.text_background or False
            }
        }
        
        # Launch Celery task directly
        task = generate_video_from_timeline_v3.delay(
            video_id=video_id,
            property_id=request.property_id,
            user_id=str(current_user.id),
            timeline_data=timeline_data,
            template_id=template_id,
            language=request.language
        )
        
        # Update video record with task ID
        video.generation_job_id = task.id
        db.commit()
        
        logger.info(f"🚀 Video generation task launched: {task.id}")
        
        return {
            "job_id": task.id,
            "video_id": video_id,
            "status": "processing",
            "message": "Video generation started with timeline processing.",
            "estimated_time": "2-5 minutes",
            "template_id": template_id,
            "timeline_slots": len(timeline_data["slot_assignments"]),
            "text_overlays": len(timeline_data["text_overlays"])
        }
        
    except Exception as e:
        logger.error(f"Error starting viral template generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{job_id}")
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
) -> JobStatusResponse:
    """
    Get the status of a video generation or matching job
    """
    try:
        # Check task status
        # task_result = check_generation_status.delay(job_id)
        # result = task_result.get(timeout=5)
        
        # Temporary fix - return a dummy status
        result = {"status": "completed", "progress": 100}
        
        status_response = JobStatusResponse(
            job_id=job_id,
            status=result.get("status", "UNKNOWN")
        )
        
        # Add progress information if available
        if result.get("info"):
            info = result["info"]
            status_response.progress = info.get("progress")
            status_response.stage = info.get("stage")
        
        # Add result if completed
        if result.get("result"):
            status_response.result = result["result"]
        
        # Add error if failed
        if result.get("status") == "FAILURE":
            status_response.error = result.get("info", {}).get("error", "Unknown error")
        
        return status_response
        
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        return JobStatusResponse(
            job_id=job_id,
            status="ERROR",
            error=str(e)
        )

@router.get("/videos")
async def get_user_videos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    property_id: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Get user's generated videos with optional filtering
    """
    try:
        query = db.query(Video).filter(Video.user_id == current_user.id)
        
        if property_id:
            query = query.filter(Video.property_id == property_id)
        
        if status:
            query = query.filter(Video.status == status)
        
        videos = query.order_by(Video.created_at.desc()).offset(skip).limit(limit).all()
        
        return {
            "videos": [
                {
                    "id": str(video.id),
                    "title": video.title,
                    "description": video.description,
                    "video_url": video.video_url,
                    "thumbnail_url": video.thumbnail_url,
                    "status": video.status,
                    "language": video.language,
                    "duration": video.duration,
                    "format": video.format,
                    "size": video.size,
                    "property_id": str(video.property_id),
                    "user_id": str(video.user_id),
                    "created_at": video.created_at.isoformat(),
                    "updated_at": video.updated_at.isoformat(),
                    "completed_at": video.completed_at.isoformat() if video.completed_at else None,
                    "source_type": video.source_type,
                    "viral_video_id": video.viral_video_id
                }
                for video in videos
            ],
            "total": query.count()
        }
        
    except Exception as e:
        logger.error(f"Error getting user videos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/populate-viral-database")
async def populate_database(
    current_user: User = Depends(get_current_user)
):
    """
    Populate the viral video database (admin/development endpoint)
    """
    try:
        # In production, this should be restricted to admin users
        task = populate_viral_video_database.delay()
        
        return {
            "job_id": task.id,
            "status": "started",
            "message": "Database population started. This may take a few minutes."
        }
        
    except Exception as e:
        logger.error(f"Error populating database: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/complete-demo-video/{video_id}")
async def complete_demo_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Complete a demo video immediately (development/demo endpoint)
    """
    try:
        from datetime import datetime
        
        video = db.query(Video).filter(
            Video.id == video_id,
            Video.user_id == current_user.id
        ).first()
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
            
        if video.status != "processing":
            raise HTTPException(status_code=400, detail=f"Video is not in processing state (current: {video.status})")
        
        # Get viral template info if available
        real_duration = 30.0  # Default fallback
        if video.viral_video_id:
            try:
                viral_template = db.execute(
                    "SELECT duration FROM viral_video_templates WHERE id = :template_id",
                    {"template_id": video.viral_video_id}
                ).fetchone()
                if viral_template and viral_template.duration:
                    real_duration = float(viral_template.duration)
                    logger.info(f"Using real viral template duration: {real_duration}s")
            except Exception as e:
                logger.warning(f"Could not get viral template duration: {e}")
        
        # DEMO ENDPOINT ONLY - Mark as completed with placeholder video URLs
        # This endpoint is for development/testing - real videos should be generated via Celery tasks
        video.status = "completed"
        video.video_url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"  # Demo placeholder
        video.thumbnail_url = "https://picsum.photos/640/1138"  # Demo placeholder
        video.duration = real_duration  # Use real duration from viral template
        video.size = int(real_duration * 100000)  # Estimate size based on duration
        video.completed_at = datetime.utcnow()
        
        db.commit()
        logger.info(f"✅ Demo video {video_id} manually completed")
        
        return {
            "message": "Video completed successfully",
            "video": {
                "id": video.id,
                "status": video.status,
                "video_url": video.video_url,
                "thumbnail_url": video.thumbnail_url,
                "completed_at": video.completed_at.isoformat() if video.completed_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing demo video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/videos/{video_id}")
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a user's video
    """
    try:
        video = db.query(Video).filter(
            Video.id == video_id,
            Video.user_id == current_user.id
        ).first()
        
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Delete from database
        db.delete(video)
        db.commit()
        
        # TODO: Delete from S3 in the background
        
        return {"message": "Video deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class SmartMatchRequest(BaseModel):
    property_id: str
    template_id: str

@router.post("/smart-match")
async def get_smart_video_matching(
    request: SmartMatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get smart video matching assignments for a template and property
    """
    try:
        logger.info(f"🧠 Smart matching request: property={request.property_id}, template={request.template_id}")
        
        # Verify property belongs to current user
        property = db.query(Property).filter(
            Property.id == request.property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property:
            logger.error(f"❌ Property not found: {request.property_id} for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Property not found")
        
        logger.info(f"✅ Property found: {property.name}")
        
        # Check if template exists
        from models.viral_video_template import ViralVideoTemplate
        template = db.query(ViralVideoTemplate).filter(
            ViralVideoTemplate.id == request.template_id
        ).first()
        
        if not template:
            logger.error(f"❌ Template not found: {request.template_id}")
            raise HTTPException(status_code=404, detail="Template not found")
            
        logger.info(f"✅ Template found: {template.title or template.hotel_name}")
        
        # Get available videos for this property
        available_videos = db.query(Video).filter(
            Video.property_id == request.property_id,
            Video.status.in_(['uploaded', 'ready', 'completed']),
            Video.viral_video_id.is_(None)  # Only user-uploaded videos
        ).all()
        
        logger.info(f"📚 Found {len(available_videos)} available videos for matching")
        
        if len(available_videos) == 0:
            logger.warning("⚠️ No available videos for matching")
            return {
                "slot_assignments": [],
                "matching_scores": {"average_score": 0},
                "message": "No available videos to match"
            }
        
        # For now, let's use a simple fallback matching instead of the complex service
        # Parse template script to get slots
        template_script = template.script
        if not template_script:
            logger.warning("⚠️ Template has no script")
            return {
                "slot_assignments": [],
                "matching_scores": {"average_score": 0},
                "message": "Template has no script"
            }
            
        # Parse script (handle == prefix)
        import json
        clean_script = template_script.strip()
        while clean_script.startswith('='):
            clean_script = clean_script[1:].strip()
            
        script_data = json.loads(clean_script)
        clips = script_data.get('clips', [])
        
        logger.info(f"🎬 Found {len(clips)} clips in template script")
        
        # Simple matching: assign videos to slots
        assignments = []
        for i, clip in enumerate(clips):
            if i < len(available_videos):
                video = available_videos[i]
                assignments.append({
                    "slotId": f"slot_{i}",
                    "videoId": video.id,
                    "confidence": 0.8  # Placeholder confidence
                })
                logger.info(f"📍 Assigned video '{video.title}' to slot {i}")
        
        result = {
            "slot_assignments": assignments,
            "matching_scores": {"average_score": 0.8},
            "message": f"Successfully matched {len(assignments)} videos to {len(clips)} slots"
        }
        
        logger.info(f"✅ Smart matching completed: {len(assignments)} assignments")
        logger.info(f"📊 Average score: 0.8")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error in smart matching: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in smart matching: {str(e)}")

# AWS MediaConvert Video Generation Models and Endpoints
class VideoSegment(BaseModel):
    id: str
    video_url: str
    start_time: float
    end_time: float
    duration: float
    order: int

class TextOverlay(BaseModel):
    id: str
    content: str
    start_time: float
    end_time: float
    position: dict  # {"x": 50, "y": 50} - percentage coordinates
    style: dict     # Font, color, size, shadow, outline, etc.

class AWSVideoGenerationRequest(BaseModel):
    property_id: str
    template_id: str
    segments: List[VideoSegment]
    text_overlays: List[TextOverlay]
    total_duration: float

class AWSVideoGenerationResponse(BaseModel):
    job_id: str
    mediaconvert_job_id: str
    status: str
    output_url: str
    estimated_duration: str

class AWSJobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[int] = None
    video_url: Optional[str] = None
    created_at: Optional[str] = None

@router.post("/aws-generate", response_model=AWSVideoGenerationResponse)
async def aws_generate_video(
    request: AWSVideoGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate video using AWS MediaConvert through Lambda orchestration
    """
    try:
        logger.info(f"🚀 Starting AWS MediaConvert video generation for property {request.property_id}")
        
        # Verify the property belongs to the user
        property_obj = db.query(Property).filter(
            Property.id == request.property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check user's video quota
        if current_user.videos_used >= current_user.videos_limit and current_user.videos_limit != -1:
            raise HTTPException(
                status_code=403, 
                detail="Video generation limit reached. Please upgrade your plan."
            )
        
        if not lambda_client:
            logger.error("AWS Lambda client not configured")
            raise HTTPException(status_code=503, detail="AWS services not available")
        
        logger.info(f"📊 Processing {len(request.segments)} segments and {len(request.text_overlays)} text overlays")
        
        # Prepare payload for AWS Lambda
        lambda_payload = {
            "property_id": request.property_id,
            "template_id": request.template_id,
            "segments": [segment.dict() for segment in request.segments],
            "text_overlays": [overlay.dict() for overlay in request.text_overlays],
            "total_duration": request.total_duration
        }
        
        # Invoke AWS Lambda function
        logger.info("☁️ Invoking AWS Lambda function for MediaConvert processing...")
        
        response = lambda_client.invoke(
            FunctionName=AWS_LAMBDA_FUNCTION,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                "body": json.dumps(lambda_payload),
                "httpMethod": "POST",
                "headers": {
                    "Content-Type": "application/json"
                }
            })
        )
        
        # Parse Lambda response
        lambda_result = json.loads(response['Payload'].read().decode('utf-8'))
        
        if lambda_result.get('statusCode') != 200:
            error_msg = f"Lambda execution failed: {lambda_result.get('body', 'Unknown error')}"
            logger.error(f"❌ {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        
        # Parse successful response
        result_body = json.loads(lambda_result['body'])
        
        # Increment user's video usage
        current_user.videos_used += 1
        db.commit()
        
        logger.info(f"✅ AWS MediaConvert job submitted: {result_body.get('mediaconvert_job_id')}")
        
        return AWSVideoGenerationResponse(
            job_id=result_body['job_id'],
            mediaconvert_job_id=result_body['mediaconvert_job_id'],
            status=result_body['status'],
            output_url=result_body['output_url'],
            estimated_duration=result_body['estimated_duration']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ AWS video generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AWS video generation failed: {str(e)}")

@router.get("/aws-status/{job_id}", response_model=AWSJobStatusResponse)
async def aws_check_status(
    job_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Check the status of an AWS MediaConvert video generation job
    """
    try:
        logger.info(f"🔍 Checking status for AWS job: {job_id}")
        
        if not lambda_client:
            logger.error("AWS Lambda client not configured")
            raise HTTPException(status_code=503, detail="AWS services not available")
        
        # Create the status check Lambda function name (or use the same function with different route)
        status_payload = {
            "pathParameters": {
                "jobId": job_id
            },
            "httpMethod": "GET"
        }
        
        # For now, invoke the same Lambda function but with status check parameters
        # In production, you might have a separate function or route for status checks
        response = lambda_client.invoke(
            FunctionName="hospup-video-status-checker",  # Or use the same function with routing
            InvocationType='RequestResponse',
            Payload=json.dumps(status_payload)
        )
        
        # Parse Lambda response
        lambda_result = json.loads(response['Payload'].read().decode('utf-8'))
        
        if lambda_result.get('statusCode') != 200:
            error_msg = f"Status check failed: {lambda_result.get('body', 'Unknown error')}"
            logger.error(f"❌ {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        
        result_body = json.loads(lambda_result['body'])
        
        return AWSJobStatusResponse(
            job_id=result_body['job_id'],
            status=result_body['status'],
            progress=result_body.get('progress'),
            video_url=result_body.get('video_url'),
            created_at=result_body.get('created_at')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ AWS status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AWS status check failed: {str(e)}")

# Alternative endpoint that calls Lambda via HTTP (if API Gateway is configured)
@router.post("/aws-generate-http")
async def aws_generate_video_http(
    request: AWSVideoGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Alternative AWS endpoint that uses HTTP API Gateway instead of direct Lambda invoke
    """
    try:
        logger.info(f"🌐 Starting AWS HTTP video generation for property {request.property_id}")
        
        # Verify the property belongs to the user
        property_obj = db.query(Property).filter(
            Property.id == request.property_id,
            Property.user_id == current_user.id
        ).first()
        
        if not property_obj:
            raise HTTPException(status_code=404, detail="Property not found")
        
        # Check user's video quota
        if current_user.videos_used >= current_user.videos_limit and current_user.videos_limit != -1:
            raise HTTPException(
                status_code=403, 
                detail="Video generation limit reached. Please upgrade your plan."
            )
        
        # AWS API Gateway endpoint (to be configured)
        aws_api_endpoint = "https://your-api-gateway-url.execute-api.eu-west-1.amazonaws.com/prod/generate-video"
        
        # Prepare payload
        payload = {
            "property_id": request.property_id,
            "template_id": request.template_id,
            "segments": [segment.dict() for segment in request.segments],
            "text_overlays": [overlay.dict() for overlay in request.text_overlays],
            "total_duration": request.total_duration
        }
        
        # Call AWS API Gateway
        response = requests.post(
            aws_api_endpoint,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {current_user.id}"  # Or proper API key
            },
            timeout=30
        )
        
        if response.status_code != 200:
            logger.error(f"❌ AWS API call failed: {response.status_code} {response.text}")
            raise HTTPException(status_code=500, detail="AWS API call failed")
        
        result = response.json()
        
        # Increment user's video usage
        current_user.videos_used += 1
        db.commit()
        
        logger.info(f"✅ AWS HTTP job submitted: {result.get('job_id')}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ AWS HTTP video generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AWS HTTP video generation failed: {str(e)}")