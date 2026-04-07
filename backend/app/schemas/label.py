from pydantic import BaseModel, ConfigDict
import uuid

class LabelBase(BaseModel):
    name: str
    color: str | None = None

class LabelCreate(LabelBase):
    pass

class LabelUpdate(BaseModel):
    name: str | None = None
    color: str | None = None

class LabelResponse(LabelBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    workspace_id: uuid.UUID
