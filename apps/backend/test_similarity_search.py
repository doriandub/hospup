#!/usr/bin/env python3
"""
Test the similarity search functionality with real data
"""

from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.video_segment import VideoSegment
from models.video import Video

def test_similarity_search():
    """Test finding similar segments"""
    print("🔍 Testing Similarity Search\n")
    
    db = SessionLocal()
    
    try:
        # Find all segments
        segments = db.query(VideoSegment).join(Video).all()
        
        if not segments:
            print("❌ No analyzed segments found")
            print("   Run the simple analysis test first")
            return
        
        print(f"📊 Found {len(segments)} analyzed segments:")
        
        # Group by scene type
        scene_groups = {}
        for segment in segments:
            scene_type = segment.scene_type or "unknown"
            if scene_type not in scene_groups:
                scene_groups[scene_type] = []
            scene_groups[scene_type].append(segment)
        
        for scene_type, segs in scene_groups.items():
            print(f"\n🏷️  {scene_type.upper()} scenes ({len(segs)}):")
            for seg in segs:
                video = db.query(Video).filter(Video.id == seg.video_id).first()
                print(f"   - {seg.start_time:.1f}s-{seg.end_time:.1f}s in {video.title if video else 'Unknown'}")
                print(f"     \"{seg.description}\"")
                if seg.tags:
                    print(f"     Tags: {', '.join(seg.tags)}")
        
        # Demo similarity search
        if len(segments) > 1:
            print(f"\n🎯 Similarity Search Demo:")
            query_segment = segments[0]
            video = db.query(Video).filter(Video.id == query_segment.video_id).first()
            
            print(f"Query: {query_segment.scene_type} scene from {video.title if video else 'Unknown'}")
            print(f"Description: \"{query_segment.description}\"")
            
            # Find similar segments (same scene type)
            similar = db.query(VideoSegment).filter(
                VideoSegment.scene_type == query_segment.scene_type,
                VideoSegment.id != query_segment.id
            ).all()
            
            if similar:
                print(f"\\n📋 Found {len(similar)} similar segments:")
                for sim in similar:
                    sim_video = db.query(Video).filter(Video.id == sim.video_id).first()
                    print(f"   - {sim.start_time:.1f}s-{sim.end_time:.1f}s in {sim_video.title if sim_video else 'Unknown'}")
                    print(f"     \"{sim.description}\"")
                    print(f"     Confidence: {sim.confidence_score:.2f}")
            else:
                print("\\n📭 No similar segments found (this is normal with limited data)")
        
        print(f"\\n✅ Similarity search test completed!")
        print(f"\\n🎯 This demonstrates the core viral video matching concept:")
        print(f"   1. Each video is broken into analyzed segments")
        print(f"   2. Each segment has AI descriptions and scene types")  
        print(f"   3. You can find similar segments across different videos")
        print(f"   4. Perfect for matching viral patterns to user content!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_similarity_search()