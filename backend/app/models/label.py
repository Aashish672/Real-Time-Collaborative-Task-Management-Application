from sqlalchemy import Column, String, ForeignKey, Uuid
from sqlalchemy.orm import relationship
from database import Base
import uuid

class Label(Base):
    __tablename__ = "labels"
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, nullable=True) # Hex color

class TaskLabel(Base):
    __tablename__ = "task_labels"
    
    task_id = Column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    label_id = Column(Uuid(as_uuid=True), ForeignKey("labels.id", ondelete="CASCADE"), primary_key=True)
