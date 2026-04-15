from pydantic import BaseModel, ConfigDict, field_serializer
import uuid
from datetime import datetime
from typing import Optional, Any
from .user import UserPublic
from app.models.activity import ActivityAction

class ActivityBase(BaseModel):
    action: ActivityAction
    entity_type: str
    entity_id: Optional[uuid.UUID] = None
    payload: Optional[dict[str, Any]] = None

class ActivityResponse(ActivityBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    workspace_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    created_at: datetime
    
    user: Optional[UserPublic] = None

    @field_serializer('created_at')
    def serialize_dt(self, dt: datetime, _info):
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
