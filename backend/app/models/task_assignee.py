from sqlalchemy import Column, ForeignKey, Uuid, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class TaskAssignee(Base):
    __tablename__ = "task_assignees"

    task_id = Column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    assigned_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    task = relationship("Task", back_populates="assignees")
    user = relationship("User", back_populates="tasks_assigned")