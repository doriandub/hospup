"""
Preview API - Génération de previews avec FFmpeg identique à la vidéo finale
"""
import os
import tempfile
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List, Dict, Any
from pydantic import BaseModel
import subprocess
import json

from core.auth import get_current_user
from models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/preview", tags=["preview"])

class TextOverlay(BaseModel):
    content: str
    position: Dict[str, float]  # {"x": 50, "y": 50}
    style: Dict[str, Any]       # {"font_size": 48, "color": "#FFFFFF", etc.}
    textAlign: str = "left"
    start_time: float = 0
    end_time: float = 10

class PreviewRequest(BaseModel):
    text_overlays: List[TextOverlay]
    background_color: str = "#000000"  # Couleur de fond pour preview
    width: int = 1080
    height: int = 1920

@router.post("/text-overlay")
async def generate_text_overlay_preview(
    request: PreviewRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Génère un preview image avec FFmpeg en utilisant exactement la même logique que la génération vidéo.
    Retourne une image PNG avec les textes positionnés exactement comme dans la vidéo finale.
    """
    try:
        # Créer fichier temporaire pour l'image de fond
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as bg_file:
            bg_path = bg_file.name
        
        # Créer fichier temporaire pour l'image finale
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as output_file:
            output_path = output_file.name

        try:
            # Étape 1: Créer image de fond colorée
            bg_cmd = [
                'ffmpeg', '-y',
                '-f', 'lavfi', 
                '-i', f'color={request.background_color}:size={request.width}x{request.height}:duration=1',
                '-frames:v', '1',
                bg_path
            ]
            
            logger.info(f"🎨 Creating background: {' '.join(bg_cmd)}")
            subprocess.run(bg_cmd, check=True, capture_output=True)
            
            # Étape 2: Appliquer textes avec FFmpeg (EXACTEMENT comme video_generation_v3.py)
            if not request.text_overlays:
                # Pas de texte, retourner juste le fond
                return FileResponse(bg_path, media_type="image/png", filename="preview.png")
            
            # Construire les filtres texte EXACTEMENT comme dans video_generation_v3.py
            text_filters = []
            
            for text_info in request.text_overlays:
                content = text_info.content
                style = text_info.style
                position = text_info.position
                
                # Position pourcentage -> position relative (EXACTEMENT comme backend)
                x_rel = position["x"] / 100.0
                y_rel = position["y"] / 100.0
                
                # Position relative -> pixels avec ajustements (EXACTEMENT comme backend)
                video_width = request.width
                video_height = request.height
                
                x_pixels = int((x_rel * video_width)) - 30
                y_pixels = int((y_rel * video_height)) + 50
                
                # Contraintes FFmpeg (EXACTEMENT comme backend)
                x_pos = str(max(0, min(x_pixels, video_width - 50)))
                y_pos = str(max(0, min(y_pixels, video_height - 50)))
                
                # Configuration font (EXACTEMENT comme backend)
                font_file = "/System/Library/Fonts/Helvetica.ttc"
                font_size = int(style.get("font_size", 48))
                font_color = style.get("color", "#FFFFFF")
                
                logger.info(f"📍 Preview Text '{content}': {position['x']:.1f}%,{position['y']:.1f}% -> {x_pixels},{y_pixels}px -> FFmpeg({x_pos},{y_pos})")
                
                # Escape text for FFmpeg (EXACTEMENT comme backend)
                safe_text = (content
                            .replace("\\", "\\\\")
                            .replace("'", "\\'")
                            .replace('"', '\\"')
                            .replace(":", "\\:")
                            .replace("=", "\\=")
                            .replace(",", "\\,")
                            .replace("[", "\\[")
                            .replace("]", "\\]"))
                
                # Créer filtre drawtext (EXACTEMENT comme backend)
                text_filter = f"drawtext=text='{safe_text}':fontfile={font_file}:fontsize={font_size}:fontcolor={font_color}:x={x_pos}:y={y_pos}"
                
                # Ajouter effets de style (EXACTEMENT comme backend)
                if style.get("shadow", True):
                    text_filter += ":shadowcolor=black@0.8:shadowx=2:shadowy=2"
                
                if style.get("outline", False):
                    text_filter += ":bordercolor=black:borderw=2"
                
                if style.get("background", False):
                    text_filter += ":box=1:boxcolor=black@0.5:boxborderw=10"
                
                text_filters.append(text_filter)
            
            # Construire commande FFmpeg finale
            filter_chain = ",".join(text_filters)
            
            final_cmd = [
                'ffmpeg', '-y',
                '-i', bg_path,
                '-vf', filter_chain,
                '-frames:v', '1',
                output_path
            ]
            
            logger.info(f"🔧 Applying text overlays: {len(text_filters)} filters")
            logger.info(f"📝 FFmpeg command: {' '.join(final_cmd)}")
            
            result = subprocess.run(final_cmd, check=True, capture_output=True, text=True)
            
            logger.info(f"✅ Preview generated successfully: {output_path}")
            
            # Retourner l'image générée
            return FileResponse(output_path, media_type="image/png", filename="text_preview.png")
            
        finally:
            # Cleanup
            try:
                os.unlink(bg_path)
            except:
                pass
                
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ FFmpeg error: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"FFmpeg error: {e.stderr}")
    except Exception as e:
        logger.error(f"❌ Preview generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Preview error: {str(e)}")