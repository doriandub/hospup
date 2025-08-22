from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, List, Set
import json
import logging
from core.auth import verify_jwt_token
from models.user import User
from core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active WebSocket connections by user ID
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a WebSocket connection for a specific user"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection_established",
            "data": {"message": "Connected to Hospup notifications"},
            "timestamp": self._get_timestamp()
        }, websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Remove user entry if no more connections
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
        logger.info(f"WebSocket disconnected for user {user_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending message to WebSocket: {e}")

    async def send_user_message(self, message: dict, user_id: str):
        """Send a message to all connections of a specific user"""
        if user_id in self.active_connections:
            connections_to_remove = []
            
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    connections_to_remove.append(websocket)
            
            # Remove failed connections
            for websocket in connections_to_remove:
                self.active_connections[user_id].discard(websocket)

    async def broadcast_message(self, message: dict):
        """Send a message to all connected users"""
        for user_id in list(self.active_connections.keys()):
            await self.send_user_message(message, user_id)

    def get_user_connection_count(self, user_id: str) -> int:
        """Get the number of active connections for a user"""
        return len(self.active_connections.get(user_id, set()))

    def get_total_connections(self) -> int:
        """Get the total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat()

# Global connection manager instance
manager = ConnectionManager()

# WebSocket notification functions
async def notify_video_generated(user_id: str, video_data: dict):
    """Notify user that their video has been generated"""
    message = {
        "type": "video_generated",
        "data": video_data,
        "timestamp": manager._get_timestamp()
    }
    await manager.send_user_message(message, user_id)

async def notify_job_progress(user_id: str, job_id: str, progress: int, stage: str):
    """Notify user of job progress"""
    message = {
        "type": "job_progress",
        "data": {
            "job_id": job_id,
            "progress": progress,
            "stage": stage
        },
        "timestamp": manager._get_timestamp()
    }
    await manager.send_user_message(message, user_id)

async def notify_job_failed(user_id: str, job_id: str, error: str):
    """Notify user that their job has failed"""
    message = {
        "type": "job_failed",
        "data": {
            "job_id": job_id,
            "error": error
        },
        "timestamp": manager._get_timestamp()
    }
    await manager.send_user_message(message, user_id)

async def notify_matching_complete(user_id: str, job_id: str, match_count: int):
    """Notify user that viral video matching is complete"""
    message = {
        "type": "matching_complete",
        "data": {
            "job_id": job_id,
            "match_count": match_count
        },
        "timestamp": manager._get_timestamp()
    }
    await manager.send_user_message(message, user_id)

async def get_current_user_from_token(token: str, db: Session) -> User:
    """Get user from JWT token for WebSocket authentication"""
    try:
        payload = verify_jwt_token(token)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")