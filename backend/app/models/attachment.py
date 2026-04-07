from sqlalchemy  import Column, String, ForeignKey, Uuid, DateTime
from sqlalchemy.orm import relationship
from database import Base
import uuid

class Attachment(Base):
    __tablename__="attachments"


    id=Column(Uuid(as_uuid=True),primary_key=True,default=uuid.uuid4)
    task_id=Column(Uuid(as_uuid=True),ForeignKey("tasks.id",ondelete="CASCADE"),nullable=False)


    filename=Column(String,nullable=False)
    url=Column(String,nullable=False)
    uploaded_at=Column(DateTime,nullable=False)

    task=relationship("Task",back_populates="attachments")