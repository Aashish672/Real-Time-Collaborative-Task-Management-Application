import uuid
from typing import Dict, List, Any
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        # Maps workspace_id to a list of active WebSockets
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, workspace_id: uuid.UUID):
        await websocket.accept()
        if workspace_id not in self.active_connections:
            self.active_connections[workspace_id] = []
        self.active_connections[workspace_id].append(websocket)

    def disconnect(self, websocket: WebSocket, workspace_id: uuid.UUID):
        if workspace_id in self.active_connections:
            if websocket in self.active_connections[workspace_id]:
                self.active_connections[workspace_id].remove(websocket)
            if not self.active_connections[workspace_id]:
                del self.active_connections[workspace_id]

    async def broadcast_to_workspace(self, workspace_id: uuid.UUID, message: Any):
        if workspace_id in self.active_connections:
            # Prepare message string
            if not isinstance(message, str):
                message_str = json.dumps(message)
            else:
                message_str = message
                
            for connection in self.active_connections[workspace_id]:
                try:
                    await connection.send_text(message_str)
                except Exception:
                    # In case of broken pipe, we could remove here, 
                    # but disconnect usually handles it.
                    pass

# Singleton instance
manager = ConnectionManager()
