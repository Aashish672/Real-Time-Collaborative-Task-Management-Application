from sqlalchemy import Boolean,Column,DateTime,Enum,ForeignKey,Integer,String,Text,Uuid,UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import TIMESTAMP
from app.database import Base

import uuid
import enum
from datetime import datetime

class TaskStatus(enum.Enum):
    todo="todo"
    in_progress="in_progress"
    in_review="in_review"
    canceled="canceled"
    done="done"


class TaskPriority(enum.Enum):
    low="low"
    medium="medium"
    high="high"
    urgent="urgent"


class Task(Base):
    __tablename__="tasks"

    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)
    project_id=Column(Uuid(as_uuid=True),ForeignKey("projects.id",ondelete="CASCADE"),nullable=False)


    title=Column(String,nullable=False)
    description=Column(Text,nullable=True)
    status=Column(Enum(TaskStatus),default=TaskStatus.todo,nullable=False,index=True)
    priority=Column(Enum(TaskPriority),default=TaskPriority.medium,nullable=False,index=True)
    due_date=Column(DateTime(timezone=True),nullable=True)
    position=Column(Integer, default=0, nullable=False)


    created_by=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="SET NULL"),nullable=True)


    project=relationship("Project",back_populates="tasks")
    subtasks=relationship("Subtask",back_populates="task",cascade="all, delete-orphan")
    assignees=relationship("TaskAssignee",back_populates="task",cascade="all, delete-orphan")
    creator=relationship("User",back_populates="tasks_created")
    comments=relationship("Comment",back_populates="task",cascade="all, delete-orphan")
    attachments=relationship("Attachment",back_populates="task",cascade="all, delete-orphan")
    task_labels=relationship("TaskLabel",back_populates="task",cascade="all, delete-orphan")


    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

