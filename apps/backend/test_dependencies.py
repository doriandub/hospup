#!/usr/bin/env python3
"""
Test script pour vérifier que toutes les dépendances complexes fonctionnent
À exécuter sur Render pour diagnostiquer les problèmes
"""

import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_ffmpeg():
    """Test FFmpeg availability"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version = result.stdout.split('\n')[0]
            logger.info(f"✅ FFmpeg available: {version}")
            return True
        else:
            logger.error(f"❌ FFmpeg error: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        logger.error("❌ FFmpeg timeout")
        return False
    except FileNotFoundError:
        logger.error("❌ FFmpeg not found")
        return False
    except Exception as e:
        logger.error(f"❌ FFmpeg test error: {e}")
        return False

def test_torch():
    """Test PyTorch availability"""
    try:
        import torch
        logger.info(f"✅ PyTorch available: {torch.__version__}")
        logger.info(f"   CUDA available: {torch.cuda.is_available()}")
        logger.info(f"   Device: {torch.device('cuda' if torch.cuda.is_available() else 'cpu')}")
        return True
    except ImportError as e:
        logger.error(f"❌ PyTorch import error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ PyTorch test error: {e}")
        return False

def test_transformers():
    """Test Transformers library"""
    try:
        import transformers
        logger.info(f"✅ Transformers available: {transformers.__version__}")
        return True
    except ImportError as e:
        logger.error(f"❌ Transformers import error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Transformers test error: {e}")
        return False

def test_blip_model():
    """Test BLIP model loading"""
    try:
        from transformers import BlipProcessor, BlipForConditionalGeneration
        logger.info("📦 Loading BLIP model...")
        
        processor = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base')
        model = BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-base')
        
        logger.info("✅ BLIP model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"❌ BLIP model loading error: {e}")
        return False

def test_opencv():
    """Test OpenCV"""
    try:
        import cv2
        logger.info(f"✅ OpenCV available: {cv2.__version__}")
        return True
    except ImportError as e:
        logger.error(f"❌ OpenCV import error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ OpenCV test error: {e}")
        return False

def test_pillow():
    """Test Pillow"""
    try:
        from PIL import Image
        logger.info("✅ Pillow available")
        return True
    except ImportError as e:
        logger.error(f"❌ Pillow import error: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Pillow test error: {e}")
        return False

def test_services():
    """Test custom services"""
    try:
        from services.video_conversion_service import video_conversion_service
        logger.info("✅ Video conversion service available")
        video_service_ok = True
    except Exception as e:
        logger.error(f"❌ Video conversion service error: {e}")
        video_service_ok = False
    
    try:
        from services.openai_vision_service import openai_vision_service
        logger.info("✅ OpenAI Vision service available")
        blip_service_ok = True
    except Exception as e:
        logger.error(f"❌ OpenAI Vision service error: {e}")
        blip_service_ok = False
    
    return video_service_ok and blip_service_ok

def main():
    """Run all dependency tests"""
    logger.info("🔍 Testing all dependencies for complex video processing...\n")
    
    tests = [
        ("FFmpeg", test_ffmpeg),
        ("PyTorch", test_torch),
        ("Transformers", test_transformers),
        ("OpenCV", test_opencv),  
        ("Pillow", test_pillow),
        ("BLIP Model", test_blip_model),
        ("Custom Services", test_services),
    ]
    
    results = {}
    for name, test_func in tests:
        logger.info(f"\n--- Testing {name} ---")
        try:
            results[name] = test_func()
        except Exception as e:
            logger.error(f"❌ {name} test failed with exception: {e}")
            results[name] = False
    
    # Summary
    logger.info("\n" + "="*50)
    logger.info("📊 DEPENDENCY TEST SUMMARY")
    logger.info("="*50)
    
    all_ok = True
    for name, ok in results.items():
        status = "✅ OK" if ok else "❌ FAILED"
        logger.info(f"{name:15} : {status}")
        if not ok:
            all_ok = False
    
    if all_ok:
        logger.info("\n🎉 All dependencies are working! Complex processing should work.")
        return 0
    else:
        logger.info("\n⚠️ Some dependencies failed. Check the logs above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())