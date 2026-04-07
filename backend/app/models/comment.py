from sqlalchemy import Column, String, Text, ForeignKey, Uuid, DateTime, Enum
from sqlalchemy.orm import relationship

from database import Base
import uuid

class Comment(Base):
    __tablename__="comments"


    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)
    task_id=Column(Uuid(as_uuid=True),ForeignKey("tasks.id",ondelete="CASCADE"),nullable=False)
    user_id=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="SET NULL"),nullable=True)


    body=Column(Text,nullable=False)
    created_at=Column(DateTime,nullable=False)

    task=relationship("Task",back_populates="comments")
    author=relationship("User",back_populates="comments")