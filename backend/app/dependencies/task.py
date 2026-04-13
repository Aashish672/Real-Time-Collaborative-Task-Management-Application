from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from app.database import get_db
from app import models
from app import models
from app.dependencies import get_current_user, get_workspace_member


def get_valid_task(
        task_id: uuid.UUID,
        db: Session = Depends(get_db)
) -> models.Task:
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task Not Found")
    return task


def require_task_member(
        task: models.Task = Depends(get_valid_task),
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
) -> models.Task:
    assignee = db.query(models.TaskAssignee).filter(
        models.TaskAssignee.task_id == task.id,
        models.TaskAssignee.user_id == current_user.id
    ).first()

    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this task"
        )
    return task


def require_task_admin(
        task: models.Task = Depends(get_valid_task),
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
) -> models.Task:
    member = get_workspace_member(db, task.project.workspace_id, current_user.id)

    if not member or member.role not in [models.WorkspaceRole.owner, models.WorkspaceRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a project admin to perform this action"
        )
    return task