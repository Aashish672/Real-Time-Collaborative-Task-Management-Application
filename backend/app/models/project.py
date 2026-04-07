from sqlalchemy import String,Column,ForeignKey,Uuid,TIMESTAMP,Enum, func
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid
import enum

class ProjectStatus(enum.Enum):
    active="active"
    archived="archived"
    in_progress="in_progress"
    completed="completed"   


class Project(Base):
    __tablename__="projects"


    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)
    workspace_id=Column(Uuid(as_uuid=True),ForeignKey("workspaces.id",ondelete="CASCADE"),nullable=False)


    name=Column(String,nullable=False)
    description=Column(String,nullable=True)


    deadline=Column(TIMESTAMP(timezone=True),nullable=True)


    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


    status=Column(Enum(ProjectStatus),default=ProjectStatus.active,nullable=False)


    workspace=relationship("Workspace",back_populates="projects")
    tasks=relationship("Task",back_populates="project",cascade="all, delete-orphan")