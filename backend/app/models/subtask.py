from sqlalchemy import Boolean, Column, String, ForeignKey, Uuid, TIMESTAMP, func
from sqlalchemy.orm import relationship
from database import Base
import uuid

class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)

    title = Column(String, nullable=False)
    is_done = Column(Boolean, default=False, nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    task = relationship("Task", back_populates="subtasks")