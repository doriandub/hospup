#!/usr/bin/env python3
"""
Create example Instagram templates that simulate scraped viral videos.
"""

from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.instagram_template import InstagramTemplate

def create_example_instagram_templates():
    """Create example Instagram templates"""
    print("🎬 Creating Instagram Video Templates\n")
    
    db = SessionLocal()
    
    try:
        # Hotel/Travel Templates
        templates = [
            InstagramTemplate(
                instagram_url="https://www.instagram.com/p/example1/",
                instagram_id="example1",
                title="Luxury Hotel Morning Routine",
                description="POV: Waking up in a 5-star hotel ✨ Room service breakfast, marble bathroom, city views! Who else loves hotel mornings? 🏨",
                view_count=2_500_000,
                like_count=180_000,
                comment_count=12_000,
                follower_count=850_000,
                viral_score=2.94,  # view/follower ratio
                engagement_rate=0.077,  # (likes+comments)/views
                hashtags=["#hotel", "#luxury", "#morningroutine", "#travel", "#5star", "#roomservice"],
                category="hotel",
                scene_types=["bedroom", "bathroom", "balcony"],
                prompt_suggestion="Show the perfect luxury hotel morning: wake up in elegant bedroom, marble bathroom routine, breakfast with a view",
                difficulty_level="easy",
                author_username="@luxurytravel",
                author_follower_count=850_000,
                author_verified=True,
                duration_seconds=28.5,
                aspect_ratio="9:16",
                has_music=True,
                has_text_overlay=True,
                language="en"
            ),
            
            InstagramTemplate(
                instagram_url="https://www.instagram.com/p/example2/",
                instagram_id="example2", 
                title="Pool Day Paradise",
                description="This pool hit different 🏊‍♀️💫 Crystal clear water, infinity edge, sunset views... Is this heaven?",
                view_count=1_800_000,
                like_count=220_000,
                comment_count=8_500,
                follower_count=450_000,
                viral_score=4.0,
                engagement_rate=0.127,
                hashtags=["#pool", "#infinity", "#paradise", "#sunset", "#vacation", "#viral"],
                category="hotel",
                scene_types=["pool", "outdoor", "sunset"],
                prompt_suggestion="Showcase your infinity pool with crystal water, lounge areas, and stunning sunset views",
                difficulty_level="medium",
                author_username="@poolvibes",
                author_follower_count=450_000,
                author_verified=False,
                duration_seconds=15.2,
                aspect_ratio="9:16",
                has_music=True,
                has_text_overlay=False,
                language="en"
            ),

            InstagramTemplate(
                instagram_url="https://www.instagram.com/p/example3/",
                instagram_id="example3",
                title="Hotel Room Tour - Boutique Style", 
                description="Room reveal 🏨✨ Boutique hotel vibes, cozy interiors, local art, rooftop access! Rate this room 1-10?",
                view_count=980_000,
                like_count=75_000,
                comment_count=4_200,
                follower_count=320_000,
                viral_score=3.06,
                engagement_rate=0.081,
                hashtags=["#hotelroom", "#boutique", "#roomtour", "#design", "#cozy", "#local"],
                category="hotel",
                scene_types=["bedroom", "living_room", "bathroom", "balcony"],
                prompt_suggestion="Give a room tour highlighting unique design, local touches, cozy atmosphere, and special amenities",
                difficulty_level="easy",
                author_username="@boutiquehotels",
                author_follower_count=320_000,
                author_verified=True,
                duration_seconds=45.8,
                aspect_ratio="9:16",
                has_music=True,
                has_text_overlay=True,
                language="en"
            ),

            InstagramTemplate(
                instagram_url="https://www.instagram.com/p/example4/",
                instagram_id="example4",
                title="Spa Day Self Care",
                description="Self-care Sunday at the spa 🧖‍♀️💆‍♀️ Massage, facial, relaxation... My soul needed this! Who's joining next time?",
                view_count=1_200_000,
                like_count=95_000,
                comment_count=6_800,
                follower_count=280_000,
                viral_score=4.29,
                engagement_rate=0.085,
                hashtags=["#spa", "#selfcare", "#massage", "#wellness", "#relax", "#sunday"],
                category="spa",
                scene_types=["spa", "relaxation", "treatment_room"],
                prompt_suggestion="Show the ultimate spa experience: relaxing treatments, peaceful environment, self-care moments",
                difficulty_level="medium",
                author_username="@wellnessvibes",
                author_follower_count=280_000,
                author_verified=False,
                duration_seconds=22.3,
                aspect_ratio="9:16",
                has_music=True,
                has_text_overlay=True,
                language="en"
            ),

            InstagramTemplate(
                instagram_url="https://www.instagram.com/p/example5/",
                instagram_id="example5",
                title="Rooftop Dinner Golden Hour",
                description="Dinner with a view 🌅🍽️ Rooftop dining, city lights, perfect weather... Date night goals or solo luxury?",
                view_count=1_450_000,
                like_count=125_000,
                comment_count=9_200,
                follower_count=520_000,
                viral_score=2.79,
                engagement_rate=0.093,
                hashtags=["#rooftop", "#dinner", "#goldenhour", "#cityview", "#datenight", "#luxury"],
                category="restaurant",
                scene_types=["restaurant", "outdoor", "rooftop", "sunset"],
                prompt_suggestion="Capture rooftop dining during golden hour with city views, elegant table setting, and romantic ambiance",
                difficulty_level="hard",
                author_username="@finedining",
                author_follower_count=520_000,
                author_verified=True,
                duration_seconds=38.7,
                aspect_ratio="9:16",
                has_music=True,
                has_text_overlay=False,
                language="en"
            ),

            InstagramTemplate(
                instagram_url="https://www.instagram.com/p/example6/",
                instagram_id="example6",
                title="Secret Hotel Breakfast Spot",
                description="Hidden breakfast gem in this hotel 🥐☕ Local pastries, fresh coffee, garden terrace... Why don't more people know about this?",
                view_count=2_100_000,
                like_count=165_000,
                comment_count=11_500,
                follower_count=680_000,
                viral_score=3.09,
                engagement_rate=0.084,
                hashtags=["#breakfast", "#hidden", "#local", "#coffee", "#garden", "#secret"],
                category="restaurant",
                scene_types=["restaurant", "outdoor", "garden", "food"],
                prompt_suggestion="Reveal a hidden breakfast spot with local specialties, beautiful garden setting, artisanal coffee",
                difficulty_level="easy",
                author_username="@foodietravel",
                author_follower_count=680_000,
                author_verified=True,
                duration_seconds=25.6,
                aspect_ratio="9:16",
                has_music=False,
                has_text_overlay=True,
                language="en"
            ),

            InstagramTemplate(
                instagram_url="https://www.instagram.com/p/example7/",
                instagram_id="example7",
                title="Hotel Bathroom Tour - Marble Dreams",
                description="This bathroom though... 🛁✨ Marble everything, rainfall shower, deep tub, luxury products! Is this your dream bathroom?",
                view_count=890_000,
                like_count=68_000,
                comment_count=3_400,
                follower_count=190_000,
                viral_score=4.68,
                engagement_rate=0.080,
                hashtags=["#bathroom", "#marble", "#luxury", "#spa", "#bathtub", "#shower"],
                category="hotel",
                scene_types=["bathroom"],
                prompt_suggestion="Tour a luxurious marble bathroom with rainfall shower, deep soaking tub, premium amenities",
                difficulty_level="easy",
                author_username="@luxurybathrooms",
                author_follower_count=190_000,
                author_verified=False,
                duration_seconds=18.9,
                aspect_ratio="9:16",
                has_music=True,
                has_text_overlay=True,
                language="en"
            ),

            InstagramTemplate(
                instagram_url="https://www.instagram.com/p/example8/",
                instagram_id="example8",
                title="Hotel Concierge Secret Tips",
                description="Hotel concierge just told me these local secrets 🤫🗝️ Best viewpoint, hidden restaurant, local market... Save this for your next trip!",
                view_count=3_200_000,
                like_count=280_000,
                comment_count=18_500,
                follower_count=1_200_000,
                viral_score=2.67,
                engagement_rate=0.093,
                hashtags=["#concierge", "#secrets", "#local", "#tips", "#travel", "#insider"],
                category="travel",
                scene_types=["lobby", "outdoor", "local"],
                prompt_suggestion="Share insider local secrets and tips from your concierge or local knowledge",
                difficulty_level="medium",
                author_username="@travelsecrets",
                author_follower_count=1_200_000,
                author_verified=True,
                duration_seconds=52.1,
                aspect_ratio="9:16",
                has_music=False,
                has_text_overlay=True,
                language="en"
            )
        ]

        # Add all templates to database
        for template in templates:
            db.add(template)
        
        db.commit()
        
        print(f"✅ Created {len(templates)} Instagram templates:")
        for template in templates:
            print(f"   • {template.title} (viral score: {template.viral_score:.1f}, {template.view_count:,} views)")
        
        print(f"\n📊 Templates by category:")
        categories = {}
        for template in templates:
            if template.category not in categories:
                categories[template.category] = []
            categories[template.category].append(template.title)
        
        for category, titles in categories.items():
            print(f"   {category}: {len(titles)} templates")
        
        print(f"\n🎯 How to use these templates:")
        print(f"   1. Users select their property")
        print(f"   2. AI suggests prompts based on property features")
        print(f"   3. System shows matching Instagram templates")
        print(f"   4. User selects template and generates their version")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating templates: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def show_existing_templates():
    """Show existing Instagram templates"""
    print("📋 Existing Instagram Templates\n")
    
    db = SessionLocal()
    
    try:
        templates = db.query(InstagramTemplate).filter(InstagramTemplate.is_active == True).order_by(InstagramTemplate.viral_score.desc()).all()
        
        if not templates:
            print("❌ No Instagram templates found")
            print("   Run create_example_instagram_templates() first")
            return
        
        for i, template in enumerate(templates, 1):
            print(f"🎬 #{i}. {template.title}")
            print(f"   Views: {template.view_count:,} | Viral Score: {template.viral_score:.1f}")
            print(f"   Engagement: {template.engagement_rate:.1%} | Category: {template.category}")
            print(f"   Author: {template.author_username} ({template.author_follower_count:,} followers)")
            print(f"   Prompt: {template.prompt_suggestion}")
            print(f"   Hashtags: {' '.join(template.hashtags[:5])}...")
            print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "show":
        show_existing_templates()
    else:
        create_example_instagram_templates()
        print(f"\n" + "="*50)
        show_existing_templates()