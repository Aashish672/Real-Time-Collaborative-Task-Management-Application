from sqlalchemy import Column, Enum,String,ForeignKey,Integer, TIMESTAMP,Uuid,Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
import enum

from sqlalchemy.sql import func

class WorkspaceRole(enum.Enum):
    owner="owner"
    admin="admin"
    member="member"
    viewer="viewer"


class Workspace(Base):
    __tablename__="workspaces"


    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)


    name=Column(String,nullable=False)
    slug=Column(String,nullable=False,unique=True)
    logo_url=Column(String,nullable=True)
    owner_id=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="RESTRICT"),nullable=False)

    members=relationship("WorkspaceMember",back_populates="workspace",cascade="all, delete-orphan")
    projects=relationship("Project",back_populates="workspace",cascade="all, delete-orphan")
    invitations=relationship("Invitation",back_populates="workspace",cascade="all, delete-orphan")


    created_at=Column(TIMESTAMP,server_default=func.now(),nullable=False)


    labels = relationship("Label", back_populates="workspace", cascade="all, delete-orphan")


class InvitationStatus(enum.Enum):
    pending="pending"
    accepted="accepted"
    revoked="revoked"


class Invitation(Base):
    __tablename__="invitations"

    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)
    email=Column(String,nullable=False,index=True)
    workspace_id=Column(Uuid(as_uuid=True),ForeignKey("workspaces.id",ondelete="CASCADE"),nullable=False)
    invited_by_id=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="CASCADE"),nullable=False)
    role=Column(Enum(WorkspaceRole),default=WorkspaceRole.member,nullable=False)
    token=Column(String,unique=True,index=True,nullable=False)
    expires_at=Column(TIMESTAMP,nullable=False)
    status=Column(Enum(InvitationStatus),default=InvitationStatus.pending,nullable=False)

    created_at=Column(TIMESTAMP,server_default=func.now(),nullable=False)

    workspace=relationship("Workspace",back_populates="invitations")
    inviter=relationship("User")


class WorkspaceMember(Base):
# ... existing code ...
    __tablename__="workspace_members"


    workspace_id=Column(Uuid(as_uuid=True),ForeignKey("workspaces.id",ondelete="CASCADE"),nullable=False,primary_key=True)
    user_id=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="CASCADE"),nullable=False,primary_key=True)
    role=Column(Enum(WorkspaceRole),nullable=False)

    workspace=relationship("Workspace",back_populates="members")
    user=relationship("User",back_populates="workspace_membership")


class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(Uuid(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    
    url = Column(String, nullable=False)
    # e.g., "task.completed" or "task.created"
    event_type = Column(String, nullable=False) 
    
    is_active = Column(Boolean, default=True)

    workspace = relationship("Workspace", backref="webhooks")