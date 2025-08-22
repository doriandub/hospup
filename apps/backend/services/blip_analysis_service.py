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
            
            # Capitalize and clean up the caption
            clean_description = raw_caption.strip().capitalize()
            
            logger.info(f"📝 BLIP generated description: {clean_description}")
            
            return clean_description
            
        except Exception as e:
            logger.error(f"❌ BLIP analysis failed: {e}")
            # Fallback to a basic description
            return f"{property_name} featuring beautiful hospitality spaces and exceptional guest experiences."
    
    def _enhance_for_hospitality(self, raw_caption: str, property_name: str) -> str:
        """
        Enhance BLIP caption with hospitality-specific language
        
        Args:
            raw_caption: Raw caption from BLIP
            property_name: Property name for context
            
        Returns:
            Enhanced hospitality-focused description
        """
        try:
            # Clean up the caption
            caption = raw_caption.strip().lower()
            
            # Hospitality enhancement mappings
            enhancements = {
                # Views and windows
                "window": "panoramic window view",
                "view": "scenic vista",
                "landscape": "breathtaking landscape",
                "mountains": "majestic mountain views",
                "ocean": "oceanfront location",
                "sea": "seaside setting",
                "forest": "forest surroundings",
                "garden": "landscaped gardens",
                
                # Architecture and interiors
                "room": "guest accommodation",
                "door": "entrance",
                "wall": "elegant wall design",
                "stone": "traditional stone architecture",
                "wood": "refined wooden features",
                "glass": "modern glass elements",
                
                # Natural elements
                "tree": "mature trees",
                "grass": "manicured grounds",
                "flowers": "beautiful floral displays",
                "plants": "lush vegetation",
                "water": "water features",
                
                # Lighting and atmosphere
                "light": "ambient lighting",
                "shadow": "atmospheric shadows",
                "sun": "natural sunlight",
                "sky": "open sky views",
                "cloud": "dramatic sky",
            }
            
            # Apply enhancements
            enhanced_words = []
            for word in caption.split():
                # Remove punctuation for matching
                clean_word = word.strip('.,!?;:')
                if clean_word in enhancements:
                    enhanced_words.append(enhancements[clean_word])
                else:
                    enhanced_words.append(word)
            
            enhanced_caption = ' '.join(enhanced_words)
            
            # Create final hospitality-focused description without redundant property name
            hospitality_description = enhanced_caption.capitalize()
            
            # Add hospitality closing
            hospitality_endings = [
                "providing guests with an exceptional experience",
                "offering memorable moments for discerning travelers", 
                "creating the perfect ambiance for relaxation",
                "featuring premium amenities and authentic charm",
                "delivering luxury hospitality in a stunning setting"
            ]
            
            # Choose ending based on content type
            if any(word in caption for word in ["view", "window", "landscape"]):
                ending = "offering guests breathtaking views and serene surroundings"
            elif any(word in caption for word in ["room", "door", "wall"]):
                ending = "providing elegant accommodations with thoughtful design details"
            else:
                ending = hospitality_endings[0]
            
            final_description = f"{hospitality_description}, {ending}."
            
            # Capitalize first letter
            final_description = final_description[0].upper() + final_description[1:]
            
            return final_description
            
        except Exception as e:
            logger.error(f"❌ Enhancement failed: {e}")
            return f"{property_name} featuring {raw_caption} with exceptional hospitality services."

# Global service instance
blip_analysis_service = BLIPAnalysisService()