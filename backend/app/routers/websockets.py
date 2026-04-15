from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from app.services.socket_manager import manager
from app.database import get_db
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.crud.security import SECRET_KEY, ALGORITHM
from app.dependencies.workspace import check_workspace_member
import uuid
import app.models as models

router = APIRouter(prefix="/ws", tags=["WebSockets"])

async def get_user_from_token(db: Session, token: str) -> models.User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = uuid.UUID(user_id_str)
        user = db.query(models.User).filter(models.User.id == user_id).first()
        return user
    except (JWTError, ValueError):
        return None

@router.websocket("/workspace/{workspace_id}")
async def workspace_ws(
    websocket: WebSocket,
    workspace_id: uuid.UUID,
    token: str = Query(...)
):
    # 1. Authenticate
    db = next(get_db())
    user = await get_user_from_token(db, token)
    
    if not user:
        await websocket.close(code=1008) # Policy Violation
        return

    # 2. Check Permissions
    try:
        check_workspace_member(db, workspace_id, user.id)
    except Exception:
        await websocket.close(code=1008)
        return

    # 3. Connect
    await manager.connect(websocket, workspace_id)
    
    try:
        while True:
            # We don't expect client messages yet, but we need to keep the connection open
            # and listen for heartbeats or closure.
            data = await websocket.receive_text()
            # Handle potential client commands here (e.g. "START_TYPING")
    except WebSocketDisconnect:
        manager.disconnect(websocket, workspace_id)
    except Exception:
        manager.disconnect(websocket, workspace_id)
