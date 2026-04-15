from sqlalchemy import Column, String, ForeignKey, Uuid, TIMESTAMP, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid
import enum

class ActivityAction(str, enum.Enum):
    created = "created"
    updated = "updated"
    deleted = "deleted"
    completed = "completed"
    commented = "commented"
    assigned = "assigned"
    moved = "moved"

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(Uuid(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action = Column(Enum(ActivityAction), nullable=False)
    entity_type = Column(String, nullable=False) # "task", "project", "workspace", "member"
    entity_id = Column(Uuid(as_uuid=True), nullable=True)
    
    payload = Column(JSON, nullable=True) # More info e.g. task_title, old_status, new_status
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    workspace = relationship("Workspace")
    project = relationship("Project")
    user = relationship("User")
