from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List

from app import schemas, models, crud
from app.database import get_db
from app.dependencies import get_current_user, check_workspace_member


router=APIRouter(tags=["Labels"])


@router.post("/workspaces/{workspace_id}/labels", response_model=schemas.LabelResponse, status_code=status.HTTP_201_CREATED)
def create_label(
    workspace_id: uuid.UUID,
    body: schemas.LabelCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_workspace_member(db, workspace_id, current_user.id)
    return crud.create_label(db=db, workspace_id=workspace_id, body=body)


@router.get("/labels/{label_id}", response_model=schemas.LabelResponse)
def get_label(
    label_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    label = crud.get_label(db=db, label_id=label_id)
    if not label:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")
    
    # Check if user has access to the workspace this label belongs to
    check_workspace_member(db, label.workspace_id, current_user.id)
    
    return label


@router.get("/workspaces/{workspace_id}/labels", response_model=List[schemas.LabelResponse])
def list_workspace_labels(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    check_workspace_member(db, workspace_id, current_user.id)
    return crud.list_workspace_labels(db=db, workspace_id=workspace_id)


@router.put("/labels/{label_id}", response_model=schemas.LabelResponse)
def update_label(
    label_id: uuid.UUID,
    body: schemas.LabelUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    label = crud.get_label(db=db, label_id=label_id)
    if not label:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")
    
    check_workspace_member(db, label.workspace_id, current_user.id)
    return crud.update_label(db=db, label_id=label_id, body=body)


@router.delete("/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(
    label_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    label = crud.get_label(db=db, label_id=label_id)
    if not label:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")
    
    check_workspace_member(db, label.workspace_id, current_user.id)
    crud.delete_label(db=db, label_id=label_id)
    return None

