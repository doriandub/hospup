from celery import current_task
from core.celery_app import celery_app
from core.database import get_db
from models.video import Video
from models.property import Property
from services.s3_service import s3_service
# Local storage service removed - using S3 only
from services.video_conversion_service import video_conversion_service
from services.blip_analysis_service import blip_analysis_service
from core.config import settings
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
import tempfile
import os
import subprocess
import json
from datetime import datetime

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def process_uploaded_video(
    self, 
    video_id: str, 
    s3_key: str
) -> Dict[str, Any]:
    """
    Process uploaded video:
    1. Download from S3
    2. Convert to standard format (1080x1920, 30fps, H.264, AAC)
    3. Generate content description script
    4. Upload converted video back to S3
    5. Update video record
    """
    try:
        # Get database session
        db = next(get_db())
        
        # Get video record
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise ValueError(f"Video {video_id} not found")
        
        # Update task progress
        current_task.update_state(
            state="PROGRESS",
            meta={
                "stage": "downloading",
                "progress": 10,
                "video_id": video_id
            }
        )
        
        logger.info(f"🎬 Processing uploaded video: {video.title}")
        logger.info(f"📁 S3 Key: {s3_key}")
        
        # Create temporary directory for processing
        temp_dir = tempfile.mkdtemp(prefix=f"video_process_{video_id}_")
        original_path = os.path.join(temp_dir, f"original_{video_id}.mp4")
        converted_path = os.path.join(temp_dir, f"converted_{video_id}.mp4")
        
        try:
            # Step 1: Download original video (adapt based on storage backend)
            if settings.STORAGE_BACKEND == "s3":
                logger.info("📥 Downloading original video from S3...")
                download_url = s3_service.generate_presigned_download_url(s3_key, expires_in=3600)
                
                # Download using curl
                download_cmd = ["curl", "-s", "-o", original_path, download_url]
                result = subprocess.run(download_cmd, capture_output=True, text=True, timeout=300)
                
                if result.returncode != 0 or not os.path.exists(original_path):
                    raise Exception(f"Failed to download video: {result.stderr}")
                
            else:
                # Local storage - copy file directly
                logger.info("📥 Copying original video from local storage...")
                local_file_path = os.path.join("uploads", s3_key)
                
                if not os.path.exists(local_file_path):
                    raise Exception(f"Local file not found: {local_file_path}")
                
                import shutil
                shutil.copy2(local_file_path, original_path)
            
            logger.info(f"✅ Video ready for processing: {os.path.getsize(original_path):,} bytes")
            
            # Update progress
            current_task.update_state(
                state="PROGRESS",
                meta={
                    "stage": "analyzing",
                    "progress": 25,
                    "video_id": video_id
                }
            )
            
            # Step 2: Get original video metadata
            original_metadata = video_conversion_service.get_video_metadata(original_path)
            logger.info(f"📊 Original metadata: {original_metadata}")
            
            # Step 3: Check if conversion is needed
            needs_conversion = video_conversion_service.is_conversion_needed(original_metadata)
            
            if needs_conversion:
                logger.info("🔄 Video conversion needed")
                
                # Update progress
                current_task.update_state(
                    state="PROGRESS",
                    meta={
                        "stage": "converting",
                        "progress": 40,
                        "video_id": video_id
                    }
                )
                
                # Step 4: Convert video to standard format
                conversion_result = video_conversion_service.convert_to_standard_format(
                    original_path, 
                    converted_path
                )
                
                if not conversion_result["success"]:
                    raise Exception(f"Video conversion failed: {conversion_result['error']}")
                
                logger.info("✅ Video conversion completed")
                final_video_path = converted_path
                final_metadata = conversion_result["output_metadata"]
                
            else:
                logger.info("✅ Video already in standard format")
                final_video_path = original_path
                final_metadata = original_metadata
            
            # Update progress
            current_task.update_state(
                state="PROGRESS",
                meta={
                    "stage": "generating_script",
                    "progress": 60,
                    "video_id": video_id
                }
            )
            
            # Step 5: Generate content description script
            logger.info("📝 Generating content description...")
            content_description = generate_video_content_description(
                final_video_path, 
                video.title,
                video.property_id,
                db
            )
            
            # Update progress
            current_task.update_state(
                state="PROGRESS",
                meta={
                    "stage": "uploading",
                    "progress": 80,
                    "video_id": video_id
                }
            )
            
            # Step 6: Upload processed video (adapt based on storage backend)
            final_s3_key = s3_key
            if needs_conversion:
                # Upload converted video with "_processed" suffix
                base_key = s3_key.rsplit('.', 1)[0]  # Remove extension
                final_s3_key = f"{base_key}_processed.mp4"
                
                if settings.STORAGE_BACKEND == "s3":
                    logger.info(f"☁️ Uploading converted video to S3: {final_s3_key}")
                    with open(final_video_path, 'rb') as video_file:
                        upload_result = s3_service.upload_file_direct(
                            video_file, 
                            final_s3_key, 
                            content_type="video/mp4",
                            public_read=False
                        )
                    
                    if not upload_result.get("success"):
                        raise Exception(f"Failed to upload converted video: {upload_result.get('error')}")
                    
                    logger.info("✅ Converted video uploaded to S3")
                    
                    # Clean up original file to save storage costs
                    try:
                        logger.info(f"🗑️ Deleting original file: {s3_key}")
                        if s3_service.delete_file(s3_key):
                            logger.info("✅ Original file deleted successfully")
                        else:
                            logger.warning("⚠️ Failed to delete original file")
                    except Exception as e:
                        logger.warning(f"⚠️ Error deleting original file: {e}")
                
                else:
                    # Local storage - copy converted file to final location
                    logger.info(f"📁 Saving converted video locally: {final_s3_key}")
                    final_local_path = os.path.join("uploads", final_s3_key)
                    
                    # Ensure directory exists
                    os.makedirs(os.path.dirname(final_local_path), exist_ok=True)
                    
                    import shutil
                    shutil.copy2(final_video_path, final_local_path)
                    
                    logger.info("✅ Converted video saved locally")
                    
                    # Remove original file to save space
                    try:
                        original_local_path = os.path.join("uploads", s3_key)
                        if os.path.exists(original_local_path):
                            os.remove(original_local_path)
                            logger.info("✅ Original file deleted successfully")
                    except Exception as e:
                        logger.warning(f"⚠️ Error deleting original file: {e}")
            
            # Step 7: Update video record with processed information
            if settings.STORAGE_BACKEND == "s3":
                video.video_url = f"s3://{s3_service.bucket_name}/{final_s3_key}"
            else:
                video.video_url = f"s3://hospup-files/{final_s3_key}"  # Keep consistent format for local
            # Update status to "processing" during conversion
            video.status = "processing"
            video.duration = final_metadata.get("duration")
            video.size = final_metadata.get("size", os.path.getsize(final_video_path))
            video.format = "mp4"  # Always MP4 after processing
            # Enhance description with AI analysis but keep original as fallback
            enhanced_description = f"{video.description}\n\nAI Analysis: {content_description}" if video.description else content_description
            video.description = enhanced_description
            
            # Step 8: Generate thumbnail
            thumbnail_url = _generate_video_thumbnail(final_video_path, video_id, temp_dir)
            if thumbnail_url:
                video.thumbnail_url = thumbnail_url
                logger.info(f"✅ Thumbnail generated: {thumbnail_url}")
            else:
                logger.warning("⚠️ Failed to generate thumbnail")
            
            # Store processing metadata
            processing_metadata = {
                "original_metadata": original_metadata,
                "final_metadata": final_metadata,
                "conversion_needed": needs_conversion,
                "content_description": content_description,
                "processed_at": datetime.utcnow().isoformat(),
                "s3_key": final_s3_key
            }
            
            if needs_conversion and "compression_ratio" in conversion_result:
                processing_metadata["compression_ratio"] = conversion_result["compression_ratio"]
            
            # Store as JSON in source_data field
            video.source_data = json.dumps(processing_metadata)
            
            # Determine final status based on AI description availability
            if content_description and not content_description.startswith("No content description available"):
                # AI description generated successfully
                video.status = "ready"  # Ready to use
                logger.info(f"✅ Video ready with AI description: {content_description[:50]}...")
            else:
                # Video processed but no AI description
                video.status = "uploaded"  # Uploaded but not ready for use
                logger.info(f"⚠️ Video uploaded but AI description missing")
            
            db.commit()
            
            logger.info(f"✅ Video processing completed for {video_id}")
            
            # Final progress update
            current_task.update_state(
                state="PROGRESS",
                meta={
                    "stage": "completed",
                    "progress": 100,
                    "video_id": video_id
                }
            )
            
            return {
                "video_id": video_id,
                "status": "completed",
                "original_size": original_metadata.get("size", 0),
                "final_size": final_metadata.get("size", 0),
                "conversion_needed": needs_conversion,
                "content_description": content_description,
                "duration": final_metadata.get("duration"),
                "s3_key": final_s3_key
            }
            
        finally:
            # Cleanup temporary files
            try:
                import shutil
                shutil.rmtree(temp_dir)
                logger.info("🧹 Cleaned up temporary files")
            except Exception as e:
                logger.warning(f"⚠️ Cleanup failed: {e}")
                
    except Exception as e:
        logger.error(f"❌ Video processing error: {str(e)}")
        
        # Log error but don't change video status to failed (it's already uploaded)
        try:
            if 'video' in locals():
                # Just add error info to description, don't change status
                error_info = f"\n\nProcessing error: {str(e)}"
                if video.description:
                    video.description += error_info
                else:
                    video.description = f"Video uploaded successfully{error_info}"
                db.commit()
        except:
            pass
        
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e), "video_id": video_id}
        )
        raise
    finally:
        if 'db' in locals():
            db.close()

def generate_video_content_description(
    video_path: str, 
    video_title: str, 
    property_id: str,
    db: Session
) -> str:
    """
    Generate content description for a video using AI analysis
    
    Args:
        video_path: Path to video file
        video_title: Original video title
        property_id: Property ID for context
        db: Database session
        
    Returns:
        Generated content description
    """
    try:
        # Get property info for context
        property_obj = db.query(Property).filter(Property.id == property_id).first()
        property_context = ""
        if property_obj:
            property_context = f"Property: {property_obj.name} in {property_obj.city}, {property_obj.country}"
        
        # Extract frame from the video for analysis
        temp_dir = os.path.dirname(video_path)
        frame_path = os.path.join(temp_dir, "frame_analysis.jpg")
        
        # Get video metadata first to calculate duration
        from services.video_conversion_service import video_conversion_service
        video_metadata = video_conversion_service.get_video_metadata(video_path)
        video_duration = video_metadata.get("duration", 2.0)
        
        # Extract frame at 50% of video duration (middle of video)
        middle_time = video_duration / 2.0
        extract_cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-ss", str(middle_time),  # Extract at middle of video
            "-vframes", "1",
            "-vf", "scale=512:512",  # Smaller for analysis
            frame_path
        ]
        
        result = subprocess.run(extract_cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and os.path.exists(frame_path):
            logger.info("🖼️ Frame extracted for analysis")
            
            # Use BLIP AI model for intelligent image analysis
            try:
                logger.info("🤖 Analyzing video content with BLIP...")
                description = blip_analysis_service.analyze_image(frame_path, property_obj.name)
                logger.info("✅ BLIP analysis successful")
            except Exception as e:
                logger.warning(f"⚠️ BLIP analysis failed: {e}, falling back to heuristic")
                description = generate_heuristic_description(video_title, property_obj)
            
        else:
            # Fallback to filename-based description
            logger.warning("⚠️ Frame extraction failed, using filename-based description")
            description = generate_heuristic_description(video_title, property_obj)
        
        logger.info(f"📝 Generated description: {description[:100]}...")
        return description
        
    except Exception as e:
        logger.error(f"❌ Content description generation failed: {e}")
        # Fallback description
        return generate_heuristic_description(video_title, property_obj)

def generate_heuristic_description(video_title: str, property_obj=None) -> str:
    """
    Generate description based on filename and property info
    
    Args:
        video_title: Original video filename
        property_obj: Property object for context
        
    Returns:
        Generated description
    """
    title_lower = video_title.lower()
    
    # Property context
    property_name = property_obj.name if property_obj else "hotel"
    property_type = property_obj.property_type.replace('_', ' ') if property_obj and property_obj.property_type else "accommodation"
    
    # Analyze filename for content type - make objective descriptions
    if any(word in title_lower for word in ['pool', 'piscine', 'swim', 'water']):
        return f"Video shows {property_name} swimming pool area with water, pool deck, seating areas, and surrounding pool facilities."
    
    elif any(word in title_lower for word in ['room', 'chambre', 'bed', 'suite', 'bedroom']):
        return f"Video shows {property_name} guest room with bed, furniture, lighting, windows, and interior room features."
    
    elif any(word in title_lower for word in ['restaurant', 'dining', 'food', 'kitchen', 'cuisine', 'repas']):
        return f"Video shows {property_name} restaurant and dining area with tables, chairs, kitchen equipment, food preparation, and dining space layout."
    
    elif any(word in title_lower for word in ['lobby', 'reception', 'entrance', 'accueil', 'hall']):
        return f"Video shows {property_name} reception and lobby area with front desk, seating, entrance doors, and lobby interior design."
    
    elif any(word in title_lower for word in ['spa', 'wellness', 'massage', 'detente', 'relaxation']):
        return f"Video shows {property_name} spa and wellness center with treatment rooms, relaxation areas, wellness equipment, and spa facilities."
    
    elif any(word in title_lower for word in ['garden', 'outdoor', 'terrace', 'jardin', 'exterieur', 'patio']):
        return f"Video shows {property_name} outdoor spaces and garden areas with landscaping, plants, seating, walkways, and exterior areas."
    
    elif any(word in title_lower for word in ['view', 'landscape', 'scenic', 'vue', 'paysage', 'panorama']):
        return f"Video shows views and landscapes around {property_name} with natural surroundings, scenery, and exterior environment."
    
    elif any(word in title_lower for word in ['bar', 'cocktail', 'drink', 'beverage', 'boisson']):
        return f"Video shows {property_name} bar area with bar counter, seating, drink preparation area, and beverage service space."
    
    elif any(word in title_lower for word in ['breakfast', 'petit', 'dejeuner', 'morning', 'matin']):
        return f"Video shows {property_name} breakfast area with food service, dining setup, morning meal preparation, and breakfast facilities."
    
    elif any(word in title_lower for word in ['event', 'conference', 'meeting', 'evenement', 'reunion']):
        return f"Video shows {property_name} event and meeting spaces with conference rooms, seating arrangements, and event facilities."
    
    else:
        # Generic description - simple and objective
        return f"Video shows interior and exterior spaces of {property_name} with various areas and facilities."

@celery_app.task(bind=True)
def get_video_processing_status(self, video_id: str) -> Dict[str, Any]:
    """
    Get the status of a video processing job
    """
    try:
        # Check if video exists and get current status
        db = next(get_db())
        video = db.query(Video).filter(Video.id == video_id).first()
        
        if not video:
            return {
                "video_id": video_id,
                "status": "NOT_FOUND",
                "error": "Video not found"
            }
        
        return {
            "video_id": video_id,
            "status": video.status,
            "title": video.title,
            "description": video.description,
            "duration": video.duration,
            "size": video.size,
            "processing_metadata": json.loads(video.source_data) if video.source_data else None
        }
        
    except Exception as e:
        logger.error(f"Error getting video processing status: {str(e)}")
        return {
            "video_id": video_id,
            "status": "ERROR",
            "error": str(e)
        }
    finally:
        if 'db' in locals():
            db.close()


def _generate_video_thumbnail(video_path: str, video_id: str, temp_dir: str) -> str:
    """
    Generate a thumbnail from the video file and upload it to storage
    
    Args:
        video_path: Path to the video file
        video_id: Unique identifier for the video
        temp_dir: Temporary directory for processing
        
    Returns:
        Thumbnail URL if successful, None if failed
    """
    try:
        # Generate thumbnail filename
        thumbnail_filename = f"{video_id}_thumbnail.jpg"
        thumbnail_path = os.path.join(temp_dir, thumbnail_filename)
        
        # First try: Standard FFmpeg command with enhanced error handling for HEVC/iPhone videos
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-hwaccel", "auto",  # Use hardware acceleration if available
            "-i", video_path,
            "-ss", "2",  # Extract frame at 2 seconds
            "-vframes", "1",  # Extract only 1 frame
            "-vf", "scale=640:1138:force_original_aspect_ratio=decrease,pad=640:1138:(ow-iw)/2:(oh-ih)/2:black",  # 9:16 aspect ratio
            "-q:v", "2",  # High quality
            "-pix_fmt", "yuv420p",  # Ensure compatible pixel format
            "-avoid_negative_ts", "make_zero",  # Handle timestamp issues
            thumbnail_path
        ]
        
        logger.info(f"🖼️ Generating thumbnail with command: {' '.join(ffmpeg_cmd)}")
        
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=30)
        
        # If first attempt fails, try fallback methods for iPhone HEVC videos
        if result.returncode != 0:
            logger.warning(f"⚠️ First attempt failed: {result.stderr}")
            
            # Fallback 1: Handle HDR/iPhone videos with strict compliance and color space conversion
            fallback_cmd = [
                "ffmpeg", "-y",
                "-strict", "unofficial",  # Allow non-standard compliance for HDR content
                "-i", video_path,
                "-ss", "1",  # Try earlier in video
                "-vframes", "1",
                "-vf", "scale=640:1138:force_original_aspect_ratio=decrease,pad=640:1138:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p",  # Force color format conversion
                "-q:v", "2",
                "-pix_fmt", "yuv420p",
                "-f", "image2",  # Force image output format
                "-map", "0:v:0",  # Map only the first video stream
                "-color_range", "pc",  # Force full range
                thumbnail_path
            ]
            
            logger.info(f"🔄 Trying HDR-compatible method: {' '.join(fallback_cmd)}")
            result = subprocess.run(fallback_cmd, capture_output=True, text=True, timeout=30)
            
            # Fallback 2: If still failing, try PNG output (more compatible than JPEG)
            if result.returncode != 0:
                logger.warning(f"⚠️ Second attempt failed: {result.stderr}")
                
                # Try PNG output which is more compatible with HDR content
                png_path = thumbnail_path.replace('.jpg', '.png')
                minimal_cmd = [
                    "ffmpeg", "-y",
                    "-strict", "unofficial",
                    "-i", video_path,
                    "-vframes", "1",  # Just get first frame
                    "-vf", "scale=640:1138:force_original_aspect_ratio=decrease,format=rgb24",  # RGB for PNG
                    "-f", "png",
                    png_path
                ]
                
                logger.info(f"🔄 Trying PNG method: {' '.join(minimal_cmd)}")
                result = subprocess.run(minimal_cmd, capture_output=True, text=True, timeout=30)
                
                # If PNG worked, convert to JPEG for consistency
                if result.returncode == 0 and os.path.exists(png_path):
                    convert_cmd = [
                        "ffmpeg", "-y",
                        "-i", png_path,
                        "-q:v", "2",
                        thumbnail_path
                    ]
                    convert_result = subprocess.run(convert_cmd, capture_output=True, text=True, timeout=10)
                    if convert_result.returncode == 0:
                        os.remove(png_path)  # Clean up PNG file
                        logger.info("✅ Successfully converted PNG to JPEG thumbnail")
                    else:
                        # Keep PNG if conversion fails
                        thumbnail_path = png_path
                        logger.info("✅ Using PNG thumbnail (JPEG conversion failed)")
        
        if result.returncode != 0:
            logger.error(f"❌ All FFmpeg attempts failed to generate thumbnail: {result.stderr}")
            return None
            
        if not os.path.exists(thumbnail_path):
            logger.error("❌ Thumbnail file was not created")
            return None
            
        logger.info(f"✅ Thumbnail generated successfully: {thumbnail_path}")
        
        # Upload thumbnail to storage
        thumbnail_s3_key = f"thumbnails/{video_id}/{thumbnail_filename}"
        
        if settings.STORAGE_BACKEND == "s3":
            # Upload to S3
            with open(thumbnail_path, 'rb') as thumbnail_file:
                upload_result = s3_service.upload_file_direct(
                    thumbnail_file, 
                    thumbnail_s3_key, 
                    content_type="image/jpeg",
                    public_read=True  # Make thumbnails public for easy access
                )
            
            if upload_result.get('success'):
                # Generate public URL for thumbnail
                thumbnail_url = f"https://{s3_service.bucket_name}.s3.amazonaws.com/{thumbnail_s3_key}"
                logger.info(f"✅ Thumbnail uploaded to S3: {thumbnail_url}")
                return thumbnail_url
            else:
                logger.error("❌ Failed to upload thumbnail to S3")
                return None
        else:
            # S3 only - local storage removed
            logger.error("❌ S3 storage not configured properly")
            return None
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Thumbnail generation timed out")
        return None
    except Exception as e:
        logger.error(f"❌ Error generating thumbnail: {str(e)}")
        return None


@celery_app.task(bind=True)
def generate_missing_thumbnails(self):
    """
    Generate thumbnails for existing videos that don't have them
    """
    try:
        db = next(get_db())
        
        # Find videos without thumbnails
        videos_without_thumbnails = db.query(Video).filter(
            Video.status == "uploaded",
            Video.thumbnail_url.is_(None),
            Video.video_url.isnot(None)
        ).all()
        
        logger.info(f"🖼️ Found {len(videos_without_thumbnails)} videos without thumbnails")
        
        if not videos_without_thumbnails:
            return {"processed": 0, "message": "No videos need thumbnails"}
        
        processed_count = 0
        
        for video in videos_without_thumbnails:
            try:
                # Create temporary directory
                import tempfile
                with tempfile.TemporaryDirectory(prefix=f"thumb_gen_{video.id}_") as temp_dir:
                    # Download video locally for thumbnail generation
                    video_filename = f"{video.id}_temp.mp4"
                    local_video_path = os.path.join(temp_dir, video_filename)
                    
                    # Extract S3 key from video URL
                    if video.video_url.startswith("s3://"):
                        s3_key = video.video_url[5:].split("/", 1)[1]
                    else:
                        logger.warning(f"Invalid video URL format: {video.video_url}")
                        continue
                    
                    # Download video
                    if settings.STORAGE_BACKEND == "s3":
                        download_url = s3_service.generate_presigned_download_url(s3_key)
                        download_cmd = ["curl", "-s", "--max-time", "60", "-o", local_video_path, download_url]
                        result = subprocess.run(download_cmd, capture_output=True, text=True, timeout=120)
                        
                        if result.returncode != 0 or not os.path.exists(local_video_path):
                            logger.warning(f"Failed to download video {video.id}: {result.stderr}")
                            continue
                    else:
                        # Local storage
                        local_source_path = os.path.join("uploads", s3_key)
                        if not os.path.exists(local_source_path):
                            logger.warning(f"Local file not found: {local_source_path}")
                            continue
                        
                        import shutil
                        shutil.copy2(local_source_path, local_video_path)
                    
                    # Generate thumbnail
                    thumbnail_url = _generate_video_thumbnail(local_video_path, video.id, temp_dir)
                    
                    if thumbnail_url:
                        video.thumbnail_url = thumbnail_url
                        processed_count += 1
                        logger.info(f"✅ Generated thumbnail for video {video.id}: {thumbnail_url}")
                    else:
                        logger.warning(f"⚠️ Failed to generate thumbnail for video {video.id}")
                        
            except Exception as e:
                logger.error(f"❌ Error processing video {video.id}: {str(e)}")
                continue
        
        # Commit all changes
        if processed_count > 0:
            db.commit()
            logger.info(f"✅ Successfully generated {processed_count} thumbnails")
        
        return {
            "processed": processed_count,
            "total_found": len(videos_without_thumbnails),
            "message": f"Generated {processed_count} thumbnails out of {len(videos_without_thumbnails)} videos"
        }
        
    except Exception as e:
        logger.error(f"❌ Bulk thumbnail generation failed: {str(e)}")
        return {"error": str(e)}
    finally:
        if 'db' in locals():
            db.close()