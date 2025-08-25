"""
BLIP Image Analysis Service for generating intelligent video descriptions
"""
import logging
from typing import Dict, Any, Optional
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

logger = logging.getLogger(__name__)

class BLIPAnalysisService:
    """Service for analyzing images using BLIP model to generate descriptions"""
    
    def __init__(self):
        self.processor = None
        self.model = None
        self._is_initialized = False
        
    def _initialize_model(self):
        """Initialize BLIP model and processor (lazy loading)"""
        if self._is_initialized:
            return
            
        try:
            logger.info("🤖 Initializing BLIP model for image analysis...")
            
            # Use BLIP-base model for image captioning
            model_name = "Salesforce/blip-image-captioning-base"
            
            self.processor = BlipProcessor.from_pretrained(model_name)
            self.model = BlipForConditionalGeneration.from_pretrained(model_name)
            
            # Use CPU since CUDA is not available
            device = "cpu"
            self.model.to(device)
            
            self._is_initialized = True
            logger.info("✅ BLIP model initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize BLIP model: {e}")
            raise
    
    def analyze_image(self, image_path: str, property_name: str = "hotel") -> str:
        """
        Analyze an image and generate a hospitality-focused description
        
        Args:
            image_path: Path to the image file
            property_name: Name of the property for context
            
        Returns:
            Generated description text
        """
        try:
            self._initialize_model()
            
            logger.info(f"🖼️ Analyzing image: {image_path}")
            
            # Load and process image
            image = Image.open(image_path).convert('RGB')
            
            # Generate caption
            inputs = self.processor(image, return_tensors="pt")
            
            with torch.no_grad():
                # Generate description with hospitality context
                generated_ids = self.model.generate(
                    **inputs,
                    max_length=50,
                    num_beams=5,
                    temperature=0.7,
                    do_sample=True,
                    early_stopping=True
                )
            
            # Decode the generated text
            raw_caption = self.processor.decode(generated_ids[0], skip_special_tokens=True)
            
            # Create objective, descriptive caption
            clean_description = self._make_objective_description(raw_caption, property_name)
            
            logger.info(f"📝 BLIP generated description: {clean_description}")
            
            return clean_description
            
        except Exception as e:
            logger.error(f"❌ BLIP analysis failed: {e}")
            # Simple fallback description
            return f"Visual content showing various elements and details present in the scene at {property_name}."
    
    def _make_objective_description(self, raw_caption: str, property_name: str) -> str:
        """
        Make objective, descriptive caption focused ONLY on what's actually visible
        
        Args:
            raw_caption: Raw caption from BLIP
            property_name: Property name for context
            
        Returns:
            Pure description of visible elements only
        """
        try:
            # Clean up the caption and use it as the base
            caption = raw_caption.strip()
            
            # Remove marketing words but keep descriptive ones
            marketing_words = ['featuring', 'showcasing', 'offering', 'providing', 'delivering', 'exceptional', 'luxury', 'premium', 'stunning', 'breathtaking', 'magnificent']
            
            words = caption.split()
            objective_words = []
            
            for word in words:
                clean_word = word.strip('.,!?;:').lower()
                if clean_word not in marketing_words:
                    objective_words.append(word)
            
            objective_caption = ' '.join(objective_words).strip()
            
            # If no caption, return a generic fallback
            if not objective_caption:
                return f"Visual content showing various elements present in the scene."
            
            # Clean up generic prefixes
            if objective_caption.lower().startswith('a '):
                objective_caption = objective_caption[2:]
            if objective_caption.lower().startswith('an '):
                objective_caption = objective_caption[3:]
            
            # Simply enhance the actual BLIP description with more detail
            # But ONLY based on what BLIP actually detected
            final_description = objective_caption.capitalize()
            
            # Add some descriptive enhancement but stay factual
            if len(final_description.split()) < 8:  # If description is too short, enhance slightly
                # Add common visual descriptors that could apply to any scene
                if any(word in final_description.lower() for word in ['blue', 'water', 'ocean', 'sea']):
                    final_description += " with visible water surface and natural lighting conditions"
                elif any(word in final_description.lower() for word in ['green', 'trees', 'plants']):
                    final_description += " with natural vegetation and organic textures"
                elif any(word in final_description.lower() for word in ['building', 'structure', 'wall']):
                    final_description += " with architectural elements and structural details"
                elif any(word in final_description.lower() for word in ['room', 'interior']):
                    final_description += " with interior spatial arrangement and furnishing elements"
                else:
                    final_description += " with various visual elements and environmental details"
            
            # Ensure proper sentence structure
            if not final_description.endswith('.'):
                final_description += '.'
            
            # Clean up multiple periods
            final_description = final_description.replace('..', '.')
            
            return final_description
            
        except Exception as e:
            logger.error(f"❌ Objective description failed: {e}")
            return f"{raw_caption.capitalize()}."

# Global service instance
blip_analysis_service = BLIPAnalysisService()