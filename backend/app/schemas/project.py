from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    deadline: datetime | None = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    deadline: datetime | None = None
    status: str | None = None

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    workspace_id: uuid.UUID
    status: str
