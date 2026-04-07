from sqlalchemy import TIMESTAMP, Column, String, Text, ForeignKey, Uuid, DateTime, Enum, func
from sqlalchemy.orm import relationship

from database import Base
import uuid

class Comment(Base):
    __tablename__="comments"


    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)
    task_id=Column(Uuid(as_uuid=True),ForeignKey("tasks.id",ondelete="CASCADE"),nullable=False)
    user_id=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="SET NULL"),nullable=True)


    body=Column(Text,nullable=False)
    created_at=Column(TIMESTAMP(timezone=True),server_default=func.now(),nullable=False)
    updated_at=Column(TIMESTAMP(timezone=True),server_default=func.now(),onupdate=func.now(),nullable=False)

    task=relationship("Task",back_populates="comments")
    author=relationship("User",back_populates="comments")