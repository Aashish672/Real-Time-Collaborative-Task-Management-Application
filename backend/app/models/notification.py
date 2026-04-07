from sqlalchemy import Column,Integer,String,ForeignKey,Uuid,TIMESTAMP,Boolean,Enum
from sqlalchemy.orm import relationship
from database import Base
import uuid
import enum

class NotificationType(enum.Enum):
    task_assigned = "task_assigned"
    comment_mentioned = "comment_mentioned"
    project_updated = "project_updated"
    deadline_reminder = "deadline_reminder"

class Notification(Base):
    __tablename__="notifications"

    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)
    user_id=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="CASCADE"),nullable=False)


    type=Column(Enum(NotificationType),nullable=False)


    payload=Column(String,nullable=False)


    is_read=Column(Boolean,default=False,nullable=False)

    
    created_at=Column(TIMESTAMP,nullable=False)