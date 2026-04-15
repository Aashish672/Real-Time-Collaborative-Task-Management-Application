from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional
from .workspace import WorkspaceRole

class InvitationBase(BaseModel):
    email: EmailStr
    role: WorkspaceRole = WorkspaceRole.member

class InvitationCreate(InvitationBase):
    pass

class InvitationResponse(InvitationBase):
    id: UUID
    workspace_id: UUID
    invited_by_id: UUID
    token: str
    expires_at: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class InvitationInfo(BaseModel):
    workspace_name: str
    inviter_name: str
    email: str
    expires_at: datetime
    is_expired: bool

class InvitationAccept(BaseModel):
    pass
