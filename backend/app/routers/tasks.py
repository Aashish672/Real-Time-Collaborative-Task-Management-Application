from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List, Optional

from app import schemas, models, crud
from app.database import get_db
from app.dependencies import get_current_user


from app.dependencies.project import require_project_member
from app.dependencies.task import require_task_member, require_task_admin


from app.services.socket_manager import manager
from app.services.ai import generate_subtasks_from_title
from app.services.activity_service import ActivityService

router = APIRouter(tags=["Tasks"])


@router.post("/projects/{project_id}/tasks", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: uuid.UUID, 
    body: schemas.TaskCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user),
    project: models.Project = Depends(require_project_member)
):
    task = crud.create_task(db=db, project_id=project.id, creator_id=current_user.id, body=body)
    
    # Log Activity
    await ActivityService.log_activity(
        db=db,
        workspace_id=project.workspace_id,
        user_id=current_user.id,
        action=models.ActivityAction.created,
        entity_type="task",
        entity_id=task.id,
        project_id=project.id,
        payload={"task_title": task.title}
    )
    
    await manager.broadcast_to_workspace(project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(project.id)})
    return task


@router.get("/tasks/assigned-to-me", response_model=List[schemas.TaskResponse])
def get_user_assigned_tasks(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_user_assigned_tasks(db=db, user_id=current_user.id)


@router.get("/tasks/{task_id}", response_model=schemas.TaskResponse)
def get_task(task: models.Task = Depends(require_task_member)):

    return task


@router.get("/projects/{project_id}/tasks", response_model=List[schemas.TaskResponse])
def list_project_tasks(
    project_id: uuid.UUID, 
    status: Optional[str] = None, 
    priority: Optional[str] = None, 
    db: Session = Depends(get_db),
    project: models.Project = Depends(require_project_member)
):

    if status or priority:
        return crud.filter_tasks(db=db, project_id=project.id, status=status, priority=priority)
    return crud.list_project_tasks(db=db, project_id=project.id)


@router.put("/tasks/{task_id}", response_model=schemas.TaskResponse)
async def update_task(
    task_id: uuid.UUID, 
    body: schemas.TaskUpdate, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):
    updated_task = crud.update_task(db=db, task_id=task.id, body=body)
    await manager.broadcast_to_workspace(task.project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(task.project_id)})
    return updated_task


@router.patch("/tasks/{task_id}/status", response_model=schemas.TaskResponse)
async def update_task_status(
    task_id: uuid.UUID, 
    body: schemas.TaskStatusUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user),
    task: models.Task = Depends(require_task_member)
):
    old_status = task.status
    updated_task = crud.update_task_status(db=db, task_id=task.id, status=body.status)
    
    # Log Activity
    action = models.ActivityAction.completed if body.status == models.TaskStatus.done else models.ActivityAction.moved
    
    # Notify creator if task completed by someone else
    trigger_notify = action == models.ActivityAction.completed and task.created_by != current_user.id
    
    await ActivityService.log_activity(
        db=db,
        workspace_id=task.project.workspace_id,
        user_id=current_user.id,
        action=action,
        entity_type="task",
        entity_id=task.id,
        project_id=task.project_id,
        payload={"task_title": task.title, "old_status": old_status, "new_status": body.status},
        trigger_notification=trigger_notify,
        recipient_id=task.created_by if trigger_notify else None
    )
    
    await manager.broadcast_to_workspace(task.project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(task.project_id)})
    return updated_task


@router.patch("/tasks/{task_id}/priority", response_model=schemas.TaskResponse)
def update_task_priority(
    task_id: uuid.UUID, 
    body: schemas.TaskPriorityUpdate, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):
    return crud.update_task_priority(db=db, task_id=task.id, priority=body.priority)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_admin) 
):
    workspace_id = task.project.workspace_id
    project_id = task.project_id
    crud.delete_task(db=db, task_id=task.id)
    await manager.broadcast_to_workspace(workspace_id, {"type": "TASKS_UPDATED", "project_id": str(project_id)})
    return None

@router.post("/tasks/{task_id}/subtasks", response_model=schemas.SubtaskResponse, status_code=status.HTTP_201_CREATED)
def create_subtask(
    task_id: uuid.UUID, 
    body: schemas.SubtaskCreate, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):
    return crud.create_subtask(db=db, task_id=task.id, body=body)


@router.get("/tasks/{task_id}/subtasks", response_model=List[schemas.SubtaskResponse])
def get_subtasks(
    task_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):
    return crud.get_subtasks(db=db, task_id=task.id)


@router.post("/tasks/{task_id}/subtasks", response_model=schemas.SubtaskResponse, status_code=status.HTTP_201_CREATED)
async def create_subtask(
    task_id: uuid.UUID, 
    body: schemas.SubtaskCreate, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):
    subtask = crud.create_subtask(db=db, task_id=task.id, body=body)
    await manager.broadcast_to_workspace(task.project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(task.project_id)})
    return subtask


@router.patch("/tasks/{task_id}/subtasks/{subtask_id}/toggle", response_model=schemas.SubtaskResponse)
async def toggle_subtask_done(
    subtask_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):

    subtask = crud.toggle_subtask_done(db=db, subtask_id=subtask_id)
    if not subtask:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")
    await manager.broadcast_to_workspace(task.project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(task.project_id)})
    return subtask


@router.delete("/tasks/{task_id}/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtask(
    subtask_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):
    success = crud.delete_subtask(db=db, subtask_id=subtask_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtask not found")
    
    await manager.broadcast_to_workspace(task.project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(task.project_id)})
    return None

@router.post("/tasks/{task_id}/assignees", status_code=status.HTTP_201_CREATED)
async def assign_user_to_task(
    task_id: uuid.UUID, 
    body: schemas.TaskAssigneeCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user),
    task: models.Task = Depends(require_task_member)
):
    res = crud.assign_user_to_task(db=db, task_id=task.id, user_id=body.user_id)
    
    # Log Activity + Notify
    await ActivityService.log_activity(
        db=db,
        workspace_id=task.project.workspace_id,
        user_id=current_user.id,
        action=models.ActivityAction.assigned,
        entity_type="task",
        entity_id=task.id,
        project_id=task.project_id,
        payload={"task_title": task.title},
        trigger_notification=True,
        recipient_id=body.user_id
    )
    
    await manager.broadcast_to_workspace(task.project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(task.project_id)})
    return res


@router.delete("/tasks/{task_id}/assignees/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_assignee(
    user_id: uuid.UUID, 
    task_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):
    crud.remove_assignee(db=db, task_id=task.id, user_id=user_id)
    await manager.broadcast_to_workspace(task.project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(task.project_id)})
    return None


@router.post("/tasks/{task_id}/labels/{label_id}", status_code=status.HTTP_201_CREATED)
async def add_label_to_task(
    label_id: uuid.UUID, 
    task_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):
    res = crud.add_label_to_task(db=db, task_id=task.id, label_id=label_id)
    await manager.broadcast_to_workspace(task.project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(task.project_id)})
    return res


@router.delete("/tasks/{task_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_task_label(
    label_id: uuid.UUID, 
    task_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    task: models.Task = Depends(require_task_member)
):
    crud.remove_task_label(db=db, task_id=task.id, label_id=label_id)
    await manager.broadcast_to_workspace(task.project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(task.project_id)})
    return None


@router.patch("/projects/{project_id}/tasks/reorder")
async def reorder_tasks(
    body: schemas.TaskReorder, 
    db: Session = Depends(get_db), 
    project: models.Project = Depends(require_project_member)
):
    crud.reorder_tasks(db=db, project_id=project.id, task_ids_in_order=body.task_ids)
    await manager.broadcast_to_workspace(project.workspace_id, {"type": "TASKS_UPDATED", "project_id": str(project.id)})
    return {"detail": "Tasks reordered successfully"}


@router.get("/projects/{project_id}/tasks/stats", response_model=schemas.TaskStatisticsResponse)
def task_statistics(
    db: Session = Depends(get_db), 
    project: models.Project = Depends(require_project_member)
):
    return crud.task_statistics(db=db, project_id=project.id)



@router.post("/tasks/{task_id}/generate-subtasks",status_code=status.HTTP_201_CREATED)
def auto_generate_subtasks(
    task_id:uuid.UUID,
    db:Session=Depends(get_db),
    task:models.Task=Depends(require_task_member)):

    ai_subtasks=generate_subtasks_from_title(task.title,task.description)
    created_subtasks=[]

    for st_data in ai_subtasks:
        subtask_body = schemas.SubtaskCreate(title=st_data["title"], is_done=False)
        new_st = crud.create_subtask(db=db, task_id=task.id, body=subtask_body)
        created_subtasks.append(new_st)
        
    return {"detail": f"Successfully generated {len(created_subtasks)} subtasks", "subtasks": created_subtasks}
