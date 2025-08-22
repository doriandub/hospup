from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from core.database import get_db
from core.websocket import manager, get_current_user_from_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time notifications
    """
    try:
        # Authenticate user
        user = await get_current_user_from_token(token, db)
        user_id = str(user.id)
        
        # Connect to WebSocket
        await manager.connect(websocket, user_id)
        
        try:
            while True:
                # Keep connection alive and handle incoming messages
                data = await websocket.receive_text()
                
                # Handle ping/pong or other client messages
                if data == "ping":
                    await manager.send_personal_message({
                        "type": "pong",
                        "data": {"message": "pong"},
                        "timestamp": manager._get_timestamp()
                    }, websocket)
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
            logger.info(f"WebSocket disconnected for user {user_id}")
        except Exception as e:
            logger.error(f"WebSocket error for user {user_id}: {e}")
            manager.disconnect(websocket, user_id)
            
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        await websocket.close(code=1008)  # Policy violation