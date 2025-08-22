# Import all models for Alembic auto-detection
from .user import User
from .property import Property
from .video import Video
from .video_segment import VideoSegment

__all__ = ["User", "Property", "Video", "VideoSegment"]