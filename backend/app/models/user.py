from sqlalchemy import Boolean, Column,Integer,String,TIMESTAMP,Uuid, func
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class User(Base):
    __tablename__="users"


    id=Column(Uuid(as_uuid=True),primary_key=True,index=True,default=uuid.uuid4)


    email=Column(String,nullable=False,unique=True,index=True)
    hashed_password=Column(String,nullable=False)


    full_name=Column(String,nullable=False)
    avatar_url=Column(String,nullable=True)


    created_at=Column(TIMESTAMP,server_default=func.now(),nullable=False)


    is_active=Column(Boolean,default=True,nullable=False)
    is_verified=Column(Boolean,default=False,nullable=False)


    workspace_membership=relationship("WorkspaceMember",back_populates="user",lazy="selectin",cascade="all, delete-orphan")


    tasks_created=relationship("Task",back_populates="creator")
    task_assignee_links=relationship("TaskAssignee",back_populates="user")
    tasks_assigned=relationship("Task", secondary="task_assignees", back_populates="assignees", viewonly=True)
    comments=relationship("Comment",back_populates="author")


    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


    attachments = relationship("Attachment", back_populates="uploader", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"User(id={self.id}, email={self.email}, full_name={self.full_name})"