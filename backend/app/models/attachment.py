from sqlalchemy  import TIMESTAMP, Column, String, ForeignKey, Uuid, DateTime, func
from sqlalchemy.orm import relationship
from database import Base
import uuid

class Attachment(Base):
    __tablename__="attachments"


    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)
    task_id=Column(Uuid(as_uuid=True),ForeignKey("tasks.id",ondelete="CASCADE"),nullable=False)


    user_id=Column(Uuid(as_uuid=True),ForeignKey("users.id",ondelete="SET NULL"),nullable=True)


    filename=Column(String,nullable=False)
    url=Column(String,nullable=False)


    uploaded_at=Column(TIMESTAMP(timezone=True),server_default=func.now(),nullable=False)

    task=relationship("Task",back_populates="attachments")
    uploader=relationship("User",back_populates="attachments")