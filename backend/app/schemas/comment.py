from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class CommentBase(BaseModel):
    body: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    body: str

class CommentResponse(CommentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID | None
    created_at: datetime
