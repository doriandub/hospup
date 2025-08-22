import os
import tempfile
import subprocess
import logging
from typing import Tuple, Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

class VideoConversionService:
    """Service for converting videos to standardized format"""
    
    # Standard format specifications
    TARGET_WIDTH = 1080
    TARGET_HEIGHT = 1920
    TARGET_FRAMERATE = 30
    VIDEO_CODEC = "libx264"
    AUDIO_CODEC = "aac"
    AUDIO_BITRATE = "128k"
    CRF = 23  # Constant Rate Factor for quality
    PRESET = "veryfast"
    
    def __init__(self):
        self.temp_dir = None
    
    def convert_to_standard_format(
        self, 
        input_file_path: str, 
        output_file_path: str
    ) -> Dict[str, Any]:
        """
        Convert video to standard format:
        - Resolution: 1080x1920 (portrait)
        - Framerate: 30 fps
        - Codec: H.264 (libx264), preset veryfast, CRF 23
        - Audio: AAC 128 kbps
        
        Args:
            input_file_path: Path to input video file
            output_file_path: Path to output video file
            
        Returns:
            Dict with conversion result and metadata
        """
        try:
            logger.info(f"🎬 Converting video: {input_file_path} -> {output_file_path}")
            
            # Get input video metadata first
            input_metadata = self.get_video_metadata(input_file_path)
            logger.info(f"📊 Input video metadata: {input_metadata}")
            
            # Build FFmpeg command for standardization
            ffmpeg_cmd = [
                "ffmpeg", "-y",  # Overwrite output file
                "-i", input_file_path,  # Input file
                
                # Video filters for scaling and padding
                "-vf", f"scale={self.TARGET_WIDTH}:{self.TARGET_HEIGHT}:force_original_aspect_ratio=decrease,"
                       f"pad={self.TARGET_WIDTH}:{self.TARGET_HEIGHT}:(ow-iw)/2:(oh-ih)/2:black",
                
                # Video codec settings
                "-c:v", self.VIDEO_CODEC,
                "-preset", self.PRESET,
                "-crf", str(self.CRF),
                "-r", str(self.TARGET_FRAMERATE),  # Target framerate
                
                # Audio codec settings
                "-c:a", self.AUDIO_CODEC,
                "-b:a", self.AUDIO_BITRATE,
                "-ar", "44100",  # Audio sample rate
                
                # Container settings
                "-movflags", "+faststart",  # Optimize for web streaming
                "-pix_fmt", "yuv420p",  # Ensure compatibility
                
                output_file_path
            ]
            
            logger.info(f"🔧 FFmpeg command: {' '.join(ffmpeg_cmd)}")
            
            # Execute FFmpeg conversion
            result = subprocess.run(
                ffmpeg_cmd, 
                capture_output=True, 
                text=True, 
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                logger.error(f"❌ FFmpeg conversion failed: {result.stderr}")
                return {
                    "success": False,
                    "error": f"Conversion failed: {result.stderr}",
                    "ffmpeg_output": result.stderr
                }
            
            # Verify output file exists and get metadata
            if not os.path.exists(output_file_path):
                logger.error("❌ Output file was not created")
                return {
                    "success": False,
                    "error": "Output file was not created"
                }
            
            output_metadata = self.get_video_metadata(output_file_path)
            output_size = os.path.getsize(output_file_path)
            
            logger.info(f"✅ Video conversion successful")
            logger.info(f"📊 Output metadata: {output_metadata}")
            logger.info(f"📁 File size: {output_size:,} bytes ({output_size / (1024*1024):.2f} MB)")
            
            return {
                "success": True,
                "input_metadata": input_metadata,
                "output_metadata": output_metadata,
                "output_size": output_size,
                "compression_ratio": input_metadata.get("size", 0) / output_size if output_size > 0 else 0,
                "ffmpeg_output": result.stdout
            }
            
        except subprocess.TimeoutExpired:
            logger.error("❌ FFmpeg conversion timed out")
            return {
                "success": False,
                "error": "Conversion timed out (exceeded 5 minutes)"
            }
        except Exception as e:
            logger.error(f"❌ Video conversion error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_video_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Get video metadata using FFprobe
        
        Args:
            file_path: Path to video file
            
        Returns:
            Dict with video metadata
        """
        try:
            # Use FFprobe to get video metadata
            ffprobe_cmd = [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_format", "-show_streams",
                file_path
            ]
            
            result = subprocess.run(ffprobe_cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                logger.warning(f"⚠️ FFprobe failed: {result.stderr}")
                return {"error": result.stderr}
            
            import json
            metadata = json.loads(result.stdout)
            
            # Extract key information
            video_stream = None
            audio_stream = None
            
            for stream in metadata.get("streams", []):
                if stream.get("codec_type") == "video" and not video_stream:
                    video_stream = stream
                elif stream.get("codec_type") == "audio" and not audio_stream:
                    audio_stream = stream
            
            format_info = metadata.get("format", {})
            
            parsed_metadata = {
                "duration": float(format_info.get("duration", 0)),
                "size": int(format_info.get("size", 0)),
                "bitrate": int(format_info.get("bit_rate", 0)),
                "format_name": format_info.get("format_name", "unknown"),
            }
            
            if video_stream:
                parsed_metadata.update({
                    "width": int(video_stream.get("width", 0)),
                    "height": int(video_stream.get("height", 0)),
                    "video_codec": video_stream.get("codec_name", "unknown"),
                    "framerate": self._parse_framerate(video_stream.get("r_frame_rate", "0/1")),
                    "pixel_format": video_stream.get("pix_fmt", "unknown")
                })
            
            if audio_stream:
                parsed_metadata.update({
                    "audio_codec": audio_stream.get("codec_name", "unknown"),
                    "audio_bitrate": int(audio_stream.get("bit_rate", 0)),
                    "sample_rate": int(audio_stream.get("sample_rate", 0)),
                    "channels": int(audio_stream.get("channels", 0))
                })
            
            return parsed_metadata
            
        except subprocess.TimeoutExpired:
            logger.warning("⚠️ FFprobe timed out")
            return {"error": "Metadata extraction timed out"}
        except Exception as e:
            logger.warning(f"⚠️ Error getting video metadata: {e}")
            return {"error": str(e)}
    
    def _parse_framerate(self, framerate_str: str) -> float:
        """Parse framerate string like '30/1' to float"""
        try:
            if '/' in framerate_str:
                num, den = framerate_str.split('/')
                return float(num) / float(den) if float(den) != 0 else 0
            return float(framerate_str)
        except:
            return 0.0
    
    def is_conversion_needed(self, metadata: Dict[str, Any]) -> bool:
        """
        Check if video needs conversion based on current format
        
        Args:
            metadata: Video metadata dict
            
        Returns:
            True if conversion is needed
        """
        if metadata.get("error"):
            return True  # If we can't read metadata, convert to be safe
        
        # Check resolution
        width = metadata.get("width", 0)
        height = metadata.get("height", 0)
        if width != self.TARGET_WIDTH or height != self.TARGET_HEIGHT:
            logger.info(f"🔄 Resolution conversion needed: {width}x{height} -> {self.TARGET_WIDTH}x{self.TARGET_HEIGHT}")
            return True
        
        # Check framerate (allow some tolerance)
        framerate = metadata.get("framerate", 0)
        if abs(framerate - self.TARGET_FRAMERATE) > 1:
            logger.info(f"🔄 Framerate conversion needed: {framerate} -> {self.TARGET_FRAMERATE}")
            return True
        
        # Check video codec
        video_codec = metadata.get("video_codec", "")
        if video_codec not in ["h264", "libx264"]:
            logger.info(f"🔄 Video codec conversion needed: {video_codec} -> {self.VIDEO_CODEC}")
            return True
        
        # Check audio codec
        audio_codec = metadata.get("audio_codec", "")
        if audio_codec not in ["aac"]:
            logger.info(f"🔄 Audio codec conversion needed: {audio_codec} -> {self.AUDIO_CODEC}")
            return True
        
        logger.info("✅ Video already in standard format, no conversion needed")
        return False
    
    def estimate_output_size(self, input_metadata: Dict[str, Any]) -> int:
        """
        Estimate output file size after conversion
        
        Args:
            input_metadata: Input video metadata
            
        Returns:
            Estimated output size in bytes
        """
        duration = input_metadata.get("duration", 30)  # Default 30 seconds
        
        # Rough estimation based on target settings
        # CRF 23 at 1080x1920 typically produces ~1-3 MB per minute
        estimated_video_bitrate = 2000000  # 2 Mbps for CRF 23
        estimated_audio_bitrate = 128000   # 128 kbps
        
        total_bitrate = estimated_video_bitrate + estimated_audio_bitrate
        estimated_size = int((total_bitrate * duration) / 8)  # Convert bits to bytes
        
        return estimated_size

# Create singleton instance
video_conversion_service = VideoConversionService()