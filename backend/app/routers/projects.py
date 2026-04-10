from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, models


from app.database import get_db
from app.dependencies import get_current_user
from app.dependencies.project import get_valid_project,require_project_member,require_project_admin

import uuid

from app.dependencies.workspace import check_workspace_member

project_router=APIRouter(tags=["Projects"])

@project_router.post("/workspaces/{workspace_id}/projects",response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(body:schemas.ProjectCreate,workspace_id:uuid.UUID,db:Session=Depends(get_db),current_user:models.User=Depends(get_current_user)):
    check_workspace_member(db,workspace_id,current_user.id)
    body.owner_id = current_user.id
    new_project=crud.create_project(db=db,body=body,workspace_id=workspace_id)
    return new_project

@project_router.get("/projects/{project_id}")
def get_project(project_id:uuid.UUID,db:Session=Depends(get_db)):
    return crud.get_project(db=db,project_id=project_id)


@project_router.get("/workspaces/{workspace_id}/projects")
def list_workspace_project(workspace_id:uuid.UUID,db:Session=Depends(get_db)):
    return crud.list_workspace_projects(db=db,workspace_id=workspace_id)


@project_router.get("/projects/{project_id}/stats")
def project_statistics(project_id:uuid.UUID,db:Session=Depends(get_db)):
    return crud.project_statistics(db=db,project_id=project_id)


@project_router.put("/projects/{project_id}")
def update_project(project_id:uuid.UUID,body:schemas.ProjectUpdate,db:Session=Depends(get_db),current_user:models.User=Depends(get_current_user)):
    return crud.update_project(db=db,project_id=project_id,body=body)


@project_router.patch("/projects/{project_id}/status")
def change_project_status(project_id:uuid.UUID,body:schemas.ProjectStatusUpdate,db:Session=Depends(get_db),current_user:models.User=Depends(get_current_user)):
    return crud.change_project_status(db=db,project_id=project_id,new_status=body.status)


@project_router.delete("/projects/{project_id}",status_code=status.HTTP_204_NO_CONTENT)
def delete_project(db:Session=Depends(get_db),project:models.Project=Depends(require_project_admin)):
    crud.delete_project(db=db,project_id=project.id)
    return None