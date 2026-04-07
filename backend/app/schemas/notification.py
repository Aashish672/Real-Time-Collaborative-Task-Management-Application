from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class NotificationBase(BaseModel):
    payload: str
    is_read: bool = False

class NotificationUpdate(BaseModel):
    is_read: bool

class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    created_at: datetime
