from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session
import uuid
from typing import List


from app import schemas, models, crud
from app.database import get_db
from app.dependencies import get_current_user
from app.dependencies.workspace import (
    check_workspace_member,
    check_workspace_admin,
    check_workspace_owner
)


router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("/", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(body: schemas.WorkspaceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.create_workspace(db=db, body=body, user_id=current_user.id)
    return workspace


@router.get("/{workspace_id}", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_200_OK)
def get_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_member(db, workspace_id, current_user.id)
    
    return workspace


@router.get("/", response_model=List[schemas.WorkspaceResponse], status_code=status.HTTP_200_OK)
def list_user_workspaces(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspaces = crud.list_user_workspaces(db=db, user_id=current_user.id)
    return workspaces


@router.get("/{workspace_id}/members", response_model=List[schemas.WorkspaceMemberResponse], status_code=status.HTTP_200_OK)
def get_workspace_members(workspace_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_member(db, workspace_id, current_user.id)
    
    members = crud.get_workspaces_members(db=db, workspace_id=workspace_id)
    return members


@router.get("/slug/{slug}", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_200_OK)
def get_workspaces_slug(slug: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspaces_slug(db=db, slug=slug)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    # SECURITY CHECK: Ensure the user actually belongs to the workspace they just looked up
    check_workspace_member(db, workspace.id, current_user.id)
    
    return workspace


@router.get("/{workspace_id}/statistics", response_model=schemas.WorkspaceStatisticsResponse, status_code=status.HTTP_200_OK)
def workspace_statistics(workspace_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_member(db, workspace_id, current_user.id)
    
    stats = crud.workspace_statistics(db=db, workspace_id=workspace_id)
    return stats


@router.put("/{workspace_id}", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_200_OK)
def update_workspace(workspace_id: uuid.UUID, body: schemas.WorkspaceUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_admin(db, workspace_id, current_user.id)
    
    workspace = crud.update_workspace(db=db, workspace_id=workspace_id, body=body)
    return workspace


@router.put("/{workspace_id}/slug", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_200_OK)
def change_workspace_slug(workspace_id: uuid.UUID, body: schemas.WorkspaceSlugUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Authorize
    check_workspace_admin(db, workspace_id, current_user.id)
    
    # 2. Try/Except for the ValueError
    try:
        workspace = crud.change_workspace_slug(db=db, workspace_id=workspace_id, new_slug=body.slug)
        if not workspace:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
        return workspace
    except ValueError as e:
        # Converts the Python error into a clean HTTP error for the frontend
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{workspace_id}/members/{user_id}", response_model=schemas.WorkspaceMemberResponse, status_code=status.HTTP_200_OK)
def update_member_role(workspace_id: uuid.UUID, user_id: uuid.UUID, role: schemas.WorkspaceRole, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_admin(db, workspace_id, current_user.id)
    
    member = crud.update_member_role(db=db, workspace_id=workspace_id, user_id=user_id, role=role)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return member


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_owner(db, workspace_id, current_user.id)
    
    crud.delete_workspace(db=db, workspace_id=workspace_id)
    return None


@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(workspace_id: uuid.UUID, user_id: uuid.UUID, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workspace = crud.get_workspace(db=db, workspace_id=workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    
    check_workspace_admin(db, workspace_id, current_user.id)
    
    member = crud.remove_member(db=db, workspace_id=workspace_id, user_id=user_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return None