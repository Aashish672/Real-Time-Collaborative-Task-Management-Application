from sqlalchemy import Boolean, Column,Integer,String,TIMESTAMP,Uuid
from sqlalchemy.orm import relationship
from database import Base
import uuid

class User(Base):
    __tablename__="users"


    id=Column(Uuid(as_uuid=True),primary_key=True,index=True,default=uuid.uuid4)


    email=Column(String,nullable=False,unique=True,index=True)
    hashed_password=Column(String,nullable=False)


    full_name=Column(String,nullable=False)
    avatar_url=Column(String,nullable=True)
    created_at=Column(TIMESTAMP,nullable=False)


    is_active=Column(Boolean,default=True,nullable=False)
    is_verified=Column(Boolean,default=False,nullable=False)


    workspace_membership=relationship("WorkspaceMember",back_populates="user",lazy="selectin")
    tasks_created=relationship("Task",back_populates="creator")
    tasks_assigned=relationship("TaskAssignee",back_populates="user")
    comments=relationship("Comment",back_populates="author")

    def __repr__(self) -> str:
        return f"User(id={self.id}, email={self.email}, full_name={self.full_name})"