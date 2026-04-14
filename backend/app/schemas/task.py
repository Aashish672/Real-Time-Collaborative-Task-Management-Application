from pydantic import BaseModel, ConfigDict
from .user import UserPublic
import uuid
from datetime import datetime
from typing import List, Optional
from enum import Enum

class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    in_review = "in_review"
    canceled = "canceled"
    done = "done"

class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class SubtaskBase(BaseModel):
    title: str

class SubtaskCreate(SubtaskBase):
    is_done: bool = False

class SubtaskResponse(SubtaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    task_id: uuid.UUID
    is_done: bool

class TaskBase(BaseModel):
    title: str
    description: str | None = None
    due_date: datetime | None = None

class TaskCreate(TaskBase):
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    assignee_ids: List[uuid.UUID] | None = None
    label_ids: List[uuid.UUID] | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: datetime | None = None


from .user import UserPublic
from .label import LabelResponse
from .comment import CommentResponse

class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    project_id: uuid.UUID
    status: TaskStatus
    priority: TaskPriority
    created_by: uuid.UUID | None
    
    created_at: datetime
    updated_at: datetime

    subtasks: List[SubtaskResponse] = []
    labels: List[LabelResponse] = []
    assignees: List[UserPublic] = []
    comments: List[CommentResponse] = []



class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskPriorityUpdate(BaseModel):
    priority: TaskPriority


class TaskReorder(BaseModel):
    task_ids: List[uuid.UUID]


class TaskStatisticsResponse(BaseModel):
    total: int
    completed: int
    progress_percentage: float


class TaskAssigneeCreate(BaseModel):
    user_id: uuid.UUID
