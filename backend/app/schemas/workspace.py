from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from typing import List, Optional
import enum

class WorkspaceMemberBase(BaseModel):
    user_id: uuid.UUID
    role: str


from .user import UserPublic

class WorkspaceMemberResponse(WorkspaceMemberBase):
    model_config = ConfigDict(from_attributes=True)
    workspace_id: uuid.UUID
    user: UserPublic


class WorkspaceBase(BaseModel):
    name: str
    logo_url: Optional[str] = None


class WorkspaceCreate(WorkspaceBase):
    name:str
    slug:Optional[str]=None


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None


class WorkspaceResponse(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    slug: str
    owner_id: uuid.UUID
    created_at: datetime
    # members could be added here if needed


class WorkspaceStatisticsResponse(BaseModel):
    total_members: int
    total_projects: int
    total_tasks: int
    active_tasks: int
    completion_rate: float


class WorkspaceSlugUpdate(BaseModel):
    slug: str


class WorkspaceRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    member = "member"
    viewer = "viewer"


class WebhookBase(BaseModel):
    url: str
    event_type: str


class WebhookCreate(WebhookBase):
    pass


class WebhookUpdate(BaseModel):
    is_active: bool


class WebhookResponse(WebhookBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    workspace_id: uuid.UUID
    is_active: bool