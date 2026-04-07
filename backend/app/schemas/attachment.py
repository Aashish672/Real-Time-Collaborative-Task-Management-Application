from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class AttachmentBase(BaseModel):
    filename: str
    url: str

class AttachmentCreate(AttachmentBase):
    pass

class AttachmentResponse(AttachmentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID | None
    uploaded_at: datetime
