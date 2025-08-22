"""
Viral Videos Database
Contains scraped viral videos with their scripts for template matching
"""

VIRAL_VIDEOS = [
    {
        "id": "viral_001",
        "instagram_url": "https://www.instagram.com/reel/example1",
        "title": "Luxury Hotel Morning Routine",
        "author": "@luxuryhotels",
        "view_count": 2500000,
        "like_count": 180000,
        "duration": 15,
        "script": {
            "clips": [
                {
                    "order": 1,
                    "duration": 3.0,
                    "description": "sunrise timelapse over ocean horizon golden orange sky clouds moving fast balcony view"
                },
                {
                    "order": 2,
                    "duration": 2.5,
                    "description": "coffee cup steaming on marble table croissant fresh fruit bowl strawberries blueberries"
                },
                {
                    "order": 3,
                    "duration": 4.0,
                    "description": "woman in white robe walking to infinity pool blue water mountains background morning mist"
                },
                {
                    "order": 4,
                    "duration": 3.0,
                    "description": "breakfast spread table poolside eggs benedict avocado toast fresh juice champagne"
                },
                {
                    "order": 5,
                    "duration": 2.5,
                    "description": "feet walking on wooden deck towards beach waves crashing sand between toes"
                }
            ],
            "texts": [
                {
                    "content": "Morning in Paradise ☀️",
                    "start": 0.0,
                    "end": 3.0,
                    "position": "center",
                    "style": "bold white shadow"
                },
                {
                    "content": "Room service goals",
                    "start": 3.0,
                    "end": 5.5,
                    "position": "bottom",
                    "style": "minimal white"
                },
                {
                    "content": "Book your escape",
                    "start": 12.0,
                    "end": 15.0,
                    "position": "center",
                    "style": "gradient gold"
                }
            ]
        }
    },
    {
        "id": "viral_002",
        "instagram_url": "https://www.instagram.com/reel/example2",
        "title": "Room Tour - Hidden Gems",
        "author": "@travelcouples",
        "view_count": 1800000,
        "like_count": 95000,
        "duration": 12,
        "script": {
            "clips": [
                {
                    "order": 1,
                    "duration": 2.0,
                    "description": "door opening slowly revealing luxury suite modern design"
                },
                {
                    "order": 2,
                    "duration": 3.0,
                    "description": "panoramic room view king bed white linens floor ceiling windows city skyline"
                },
                {
                    "order": 3,
                    "duration": 2.5,
                    "description": "bathroom marble bathtub gold fixtures rain shower glass doors"
                },
                {
                    "order": 4,
                    "duration": 2.0,
                    "description": "minibar opening revealing champagne bottles luxury snacks chocolates"
                },
                {
                    "order": 5,
                    "duration": 2.5,
                    "description": "balcony sunset view wine glasses table romantic setup candles"
                }
            ],
            "texts": [
                {
                    "content": "Wait for it...",
                    "start": 0.0,
                    "end": 2.0,
                    "position": "center",
                    "style": "bold white"
                },
                {
                    "content": "$2000/night",
                    "start": 5.0,
                    "end": 7.5,
                    "position": "top",
                    "style": "red bold"
                },
                {
                    "content": "Worth every penny",
                    "start": 9.5,
                    "end": 12.0,
                    "position": "center",
                    "style": "gold cursive"
                }
            ]
        }
    },
    {
        "id": "viral_003",
        "instagram_url": "https://www.instagram.com/reel/example3",
        "title": "Pool Day Paradise",
        "author": "@poolvibes",
        "view_count": 3200000,
        "like_count": 220000,
        "duration": 10,
        "script": {
            "clips": [
                {
                    "order": 1,
                    "duration": 2.5,
                    "description": "drone shot pool from above blue water geometric shape palm trees shadows"
                },
                {
                    "order": 2,
                    "duration": 2.0,
                    "description": "underwater shot legs kicking crystal clear water bubbles sunlight rays"
                },
                {
                    "order": 3,
                    "duration": 3.0,
                    "description": "floating breakfast tray colorful fruits pancakes coffee floating pool"
                },
                {
                    "order": 4,
                    "duration": 2.5,
                    "description": "sunset cocktails pool bar bartender mixing drinks fire torch background"
                }
            ],
            "texts": [
                {
                    "content": "POV: You're here",
                    "start": 0.0,
                    "end": 2.5,
                    "position": "bottom",
                    "style": "white bold shadow"
                },
                {
                    "content": "Living the dream",
                    "start": 4.5,
                    "end": 7.5,
                    "position": "center",
                    "style": "gradient blue"
                }
            ]
        }
    }
]

# Add more viral videos here as you scrape them
# Just follow the same format:
# - Basic info (id, url, title, author, metrics)
# - Script with clips array (order, duration, description)
# - Texts array if there are overlay texts (content, start, end, position, style)