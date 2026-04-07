from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import List

class WorkspaceMemberBase(BaseModel):
    user_id: uuid.UUID
    role: str

class WorkspaceMemberResponse(WorkspaceMemberBase):
    model_config = ConfigDict(from_attributes=True)
    workspace_id: uuid.UUID

class WorkspaceBase(BaseModel):
    name: str

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: str | None = None

class WorkspaceResponse(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    slug: str
    owner_id: uuid.UUID
    created_at: datetime
    # members could be added here if needed
