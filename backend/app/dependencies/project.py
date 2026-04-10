import uuid

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import models,schemas

from app.database import get_db
from app.dependencies import get_current_user
from app.crud.project import get_project
from app.dependencies import get_workspace_member
from app import models

def get_valid_project(
        project_id:uuid.UUID,
        db:Session=Depends(get_db)
)->models.Project:
    project=get_project(db,project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Project Not Found")
    return project


def require_project_member(
        project:models.Project=Depends(get_valid_project),
        current_user:models.User=Depends(get_current_user),
        db:Session=Depends(get_db)
)->models.Project:
    member=get_workspace_member(db,project.workspace_id,current_user.id)

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project's workspace"
        )
    return project


def require_project_admin(
        project:models.Project=Depends(get_valid_project),
        current_user:models.User=Depends(get_current_user),
        db:Session=Depends(get_db)
)->models.Project:
    member=get_workspace_member(db,project.workspace_id,current_user.id)

    if not member or member.role not in [models.WorkspaceRole.owner, models.WorkspaceRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a workspace admin to modify this project"
        )
    return project