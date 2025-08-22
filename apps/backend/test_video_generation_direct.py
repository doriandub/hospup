"""
Script de test direct pour la génération vidéo v3
Teste le système sans Celery pour debug rapide
"""

import json
import uuid
import tempfile
import os
import subprocess
from datetime import datetime
from core.database import get_db
from models.video import Video
from models.property import Property
from models.viral_video_template import ViralVideoTemplate
from services.s3_service import s3_service

def test_video_generation_direct():
    """Test direct sans Celery"""
    
    # Données réelles
    property_id = "ddcf34eb-4612-4fb8-91fa-cfb30aac606d"
    user_id = "f2fc6097-c5bb-4d27-8f14-9c2b8db763e1" 
    template_id = "e50460ce-67fa-442b-bfe6-9c13b1fa87c5"
    
    # Vidéos de la content library
    content_library_videos = [
        "409eb209-97e4-4d2e-8502-d18debd973b8",  # IMG_0604 2.MOV
        "d69732d5-891c-4027-9182-03799d8d942a",  # IMG_0651.mov  
        "f88fbfdd-b63a-4bc1-bf65-d2c622fb8e1a",  # IMG_0574.MOV
        "66680fc1-5050-45ef-afed-4915c1cbd0bd",  # IMG_0494.MOV
        "f858b196-1c78-4fa5-8110-d74634bb8361"   # IMG_0590.MOV
    ]
    
    test_video_id = str(uuid.uuid4())
    
    print(f"🎬 Test vidéo ID: {test_video_id}")
    print(f"📋 Utilisation de 5 vidéos de la content library")
    
    db = None
    temp_dir = None
    
    try:
        # Get database session
        db = next(get_db())
        
        # Get records
        video = Video(id=test_video_id, title="Test", video_url="", status="processing", 
                     language="fr", user_id=user_id, property_id=property_id, viral_video_id=template_id)
        property_obj = db.query(Property).filter(Property.id == property_id).first()
        template = db.query(ViralVideoTemplate).filter(ViralVideoTemplate.id == template_id).first()
        
        print(f"✅ Property: {property_obj.name}")
        print(f"✅ Template: {template.title}")
        
        # Parse template script
        script_data = json.loads(template.script)
        template_clips = script_data.get("clips", [])
        
        print(f"📝 Template has {len(template_clips)} clips:")
        for i, clip in enumerate(template_clips):
            print(f"  Clip {i+1}: {clip.get('duration')}s")
        
        # Create slot mapping
        slot_mapping = {}
        for i, video_id in enumerate(content_library_videos):
            slot_mapping[f"slot_{i}"] = video_id
        
        print(f"🔗 Slot mapping created")
        
        # Create temp directory
        temp_dir = tempfile.mkdtemp(prefix=f"test_video_gen_{test_video_id}_")
        print(f"📁 Temp dir: {temp_dir}")
        
        # Process each clip
        video_segments = []
        for i, clip in enumerate(template_clips):
            slot_id = f"slot_{i}"
            assigned_video_id = slot_mapping.get(slot_id)
            clip_duration = clip.get("duration", 1.5)
            
            print(f"🎬 Processing clip {i+1}: {assigned_video_id} ({clip_duration}s)")
            
            # Get video record
            video_record = db.query(Video).filter(Video.id == assigned_video_id).first()
            if not video_record or not video_record.video_url:
                print(f"  ❌ Video not found: {assigned_video_id}")
                continue
            
            # Extract S3 key
            s3_key = video_record.video_url[5:].split("/", 1)[1]
            print(f"  📥 S3 key: {s3_key}")
            
            # Download video
            local_video_path = os.path.join(temp_dir, f"source_{i}.mp4")
            download_url = s3_service.generate_presigned_download_url(s3_key)
            
            print(f"  ⬇️ Downloading...")
            download_cmd = ["curl", "-s", "--max-time", "60", "-o", local_video_path, download_url]
            result = subprocess.run(download_cmd, capture_output=True, text=True, timeout=120)
            
            if result.returncode != 0 or not os.path.exists(local_video_path):
                print(f"  ❌ Download failed: {result.stderr}")
                continue
            
            print(f"  ✅ Downloaded: {os.path.getsize(local_video_path)} bytes")
            
            # Extract segment
            segment_path = os.path.join(temp_dir, f"segment_{i}.mp4")
            
            ffmpeg_cmd = [
                "ffmpeg", "-y", "-i", local_video_path,
                "-ss", "0", "-t", str(clip_duration),
                "-c:v", "libx264", "-c:a", "aac", 
                "-r", "30", "-crf", "23",
                "-avoid_negative_ts", "make_zero",
                segment_path
            ]
            
            print(f"  ✂️ Extracting {clip_duration}s segment...")
            result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0 and os.path.exists(segment_path):
                os.remove(local_video_path)  # Cleanup
                video_segments.append({
                    "path": segment_path,
                    "duration": clip_duration,
                    "order": i,
                    "video_id": assigned_video_id
                })
                print(f"  ✅ Segment created: {os.path.getsize(segment_path)} bytes")
            else:
                print(f"  ❌ FFmpeg failed: {result.stderr}")
        
        if not video_segments:
            raise Exception("No segments created")
        
        print(f"🎞️ Created {len(video_segments)} segments")
        
        # Assemble final video
        final_video_path = os.path.join(temp_dir, f"final_{test_video_id}.mp4")
        
        if len(video_segments) == 1:
            import shutil
            shutil.copy2(video_segments[0]["path"], final_video_path)
            print(f"📹 Single segment copied")
        else:
            # Concatenate
            concat_list_path = os.path.join(temp_dir, "concat_list.txt")
            
            with open(concat_list_path, 'w') as f:
                for segment in video_segments:
                    f.write(f"file '{segment['path']}'\n")
            
            concat_cmd = [
                "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                "-i", concat_list_path,
                "-c:v", "libx264", "-c:a", "aac",
                "-r", "30", "-crf", "23",
                final_video_path
            ]
            
            print(f"🔗 Concatenating {len(video_segments)} segments...")
            result = subprocess.run(concat_cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                raise Exception(f"Concatenation failed: {result.stderr}")
            
            print(f"📹 Concatenation successful")
        
        if not os.path.exists(final_video_path):
            raise Exception("Final video not created")
        
        final_size = os.path.getsize(final_video_path)
        print(f"🎬 Final video: {final_size} bytes")
        
        # Upload to S3
        s3_key = f"generated-videos/{property_id}/{test_video_id}.mp4"
        
        print(f"☁️ Uploading to S3...")
        with open(final_video_path, 'rb') as video_file:
            upload_result = s3_service.upload_file_direct(
                video_file, s3_key, content_type="video/mp4", public_read=False
            )
        
        if not upload_result.get('success'):
            raise Exception("S3 upload failed")
        
        # Generate URLs
        video_url = s3_service.generate_presigned_download_url(s3_key, expires_in=86400)
        thumbnail_url = "https://picsum.photos/640/1138"
        
        actual_duration = sum(seg.get("duration", 0) for seg in video_segments)
        
        print(f"")
        print(f"🎉 SUCCESS ! Génération terminée:")
        print(f"   - Video ID: {test_video_id}")
        print(f"   - Durée: {actual_duration}s")
        print(f"   - Segments: {len(video_segments)}")
        print(f"   - Taille finale: {final_size} bytes")
        print(f"")
        print(f"🔗 LIEN VIDEO AWS:")
        print(f"   {video_url}")
        print(f"")
        print(f"🖼️ THUMBNAIL:")
        print(f"   {thumbnail_url}")
        
        return {
            "video_id": test_video_id,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "duration": actual_duration,
            "segments_processed": len(video_segments)
        }
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        return None
        
    finally:
        if db:
            db.close()
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir)
                print(f"🧹 Cleaned up temp directory")
            except Exception as e:
                print(f"⚠️ Cleanup failed: {e}")

if __name__ == "__main__":
    print("🎬 Test de génération vidéo v3 - DIRECT")
    print("=" * 60)
    result = test_video_generation_direct()
    
    if result:
        print("=" * 60)
        print("✅ TEST RÉUSSI ! La vidéo a été générée avec succès.")
        print("Vous pouvez maintenant tester le lien AWS ci-dessus.")
    else:
        print("=" * 60)
        print("❌ TEST ÉCHOUÉ ! Vérifiez les logs d'erreur ci-dessus.")