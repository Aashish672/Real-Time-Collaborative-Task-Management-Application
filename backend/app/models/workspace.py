from sqlalchemy import Column, Enum,String,ForeignKey,Integer, TIMESTAMP,Uuid
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
    owner_id=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="RESTRICT"),nullable=False)

    members=relationship("WorkspaceMember",back_populates="workspace",cascade="all, delete-orphan")
    projects=relationship("Project",back_populates="workspace",cascade="all, delete-orphan")


    created_at=Column(TIMESTAMP,server_default=func.now(),nullable=False)


    labels = relationship("Label", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceMember(Base):
    __tablename__="workspace_members"


    workspace_id=Column(Uuid(as_uuid=True),ForeignKey("workspaces.id",ondelete="CASCADE"),nullable=False,primary_key=True)
    user_id=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="CASCADE"),nullable=False,primary_key=True)
    role=Column(Enum(WorkspaceRole),nullable=False)

    workspace=relationship("Workspace",back_populates="members")
    user=relationship("User",back_populates="workspace_membership")