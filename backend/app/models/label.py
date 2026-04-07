import uuid

from sqlalchemy import Column,Integer,String,ForeignKey,Uuid,TIMESTAMP,Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Label(Base):
    __tablename__="labels"


    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)
    workspace_id=Column(Uuid(as_uuid=True),ForeignKey("workspaces.id",ondelete="CASCADE"),nullable=False)


    name=Column(String,nullable=False)
    color=Column(String,nullable=False)


    created_at=Column(TIMESTAMP(timezone=True),server_default=func.now(),nullable=False)


    workspace=relationship("Workspace",back_populates="labels")
    task_labels=relationship("TaskLabel",back_populates="label",cascade="all, delete-orphan")




class TaskLabel(Base):
    __tablename__="task_labels"


    task_id=Column(Uuid(as_uuid=True),ForeignKey("tasks.id",ondelete="CASCADE"),primary_key=True)
    label_id=Column(Uuid(as_uuid=True),ForeignKey("labels.id",ondelete="CASCADE"),primary_key=True) 


    task=relationship("Task",back_populates="task_labels")
    label=relationship("Label",back_populates="task_labels")
    