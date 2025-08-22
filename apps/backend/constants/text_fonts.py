"""
Text customization constants for video generation
"""

# System fonts available on most platforms with FFmpeg
AVAILABLE_FONTS = [
    {
        "id": "helvetica",
        "name": "Helvetica",
        "display_name": "Helvetica",
        "file_path": "/System/Library/Fonts/Helvetica.ttc",
        "style": "modern",
        "description": "Police moderne et clean"
    },
    {
        "id": "arial",
        "name": "Arial", 
        "display_name": "Arial",
        "file_path": "/System/Library/Fonts/Arial.ttf",
        "style": "classic",
        "description": "Police classique et lisible"
    },
    {
        "id": "times",
        "name": "Times",
        "display_name": "Times New Roman", 
        "file_path": "/System/Library/Fonts/Times New Roman.ttf",
        "style": "serif",
        "description": "Police élégante avec sérifs"
    },
    {
        "id": "impact",
        "name": "Impact",
        "display_name": "Impact",
        "file_path": "/System/Library/Fonts/Impact.ttf", 
        "style": "bold",
        "description": "Police percutante et audacieuse"
    },
    {
        "id": "palatino",
        "name": "Palatino",
        "display_name": "Palatino",
        "file_path": "/System/Library/Fonts/Palatino.ttc",
        "style": "elegant",
        "description": "Police sophistiquée et raffinée"
    },
    {
        "id": "futura",
        "name": "Futura",
        "display_name": "Futura",
        "file_path": "/System/Library/Fonts/Futura.ttc",
        "style": "geometric", 
        "description": "Police géométrique et moderne"
    }
]

# Text size mappings
TEXT_SIZES = {
    "small": {"relative": 0.025, "description": "Petit (27px sur 1080p)"},
    "medium": {"relative": 0.035, "description": "Moyen (38px sur 1080p)"}, 
    "large": {"relative": 0.05, "description": "Grand (54px sur 1080p)"},
    "extra_large": {"relative": 0.07, "description": "Très grand (76px sur 1080p)"}
}

# Popular color presets for hospitality
COLOR_PRESETS = [
    {"name": "Blanc", "hex": "#FFFFFF", "description": "Classique et visible"},
    {"name": "Or", "hex": "#FFD700", "description": "Luxueux et premium"},
    {"name": "Blanc cassé", "hex": "#F5F5DC", "description": "Doux et élégant"},
    {"name": "Bleu océan", "hex": "#006994", "description": "Professionnel et apaisant"},
    {"name": "Vert nature", "hex": "#228B22", "description": "Naturel et relaxant"},
    {"name": "Rouge passion", "hex": "#DC143C", "description": "Dynamique et accueillant"},
    {"name": "Gris anthracite", "hex": "#2F4F4F", "description": "Moderne et sophistiqué"},
    {"name": "Jaune soleil", "hex": "#F3E5AB", "description": "Chaleureux et énergisant"}
]

def get_font_by_id(font_id: str):
    """Get font configuration by ID"""
    return next((font for font in AVAILABLE_FONTS if font["id"] == font_id), AVAILABLE_FONTS[0])

def get_text_size_config(size: str):
    """Get text size configuration"""
    return TEXT_SIZES.get(size, TEXT_SIZES["medium"])