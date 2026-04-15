from pydantic import BaseModel, ConfigDict
import uuid
from typing import List
from .task import TaskStatus

class ProjectSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    workspace_id: uuid.UUID

class TaskSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    project_id: uuid.UUID
    status: TaskStatus

class GlobalSearchResponse(BaseModel):
    projects: List[ProjectSearchResponse]
    tasks: List[TaskSearchResponse]
