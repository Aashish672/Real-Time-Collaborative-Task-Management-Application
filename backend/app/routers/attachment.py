from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List

from app import schemas, models, crud
from app.database import get_db
from app.dependencies import get_current_user
from app.dependencies.task import require_task_member


router=APIRouter(tags=["Attachments"])


@router.post("/tasks/{task_id}/attachments", response_model=schemas.AttachmentResponse, status_code=status.HTTP_201_CREATED)
def create_attachment(
    task_id: uuid.UUID,
    body: schemas.AttachmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    task: models.Task = Depends(require_task_member)
):
    return crud.create_attachment(db=db, task_id=task_id, user_id=current_user.id, body=body)


@router.get("/tasks/{task_id}/attachments", response_model=List[schemas.AttachmentResponse])
def get_task_attachments(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    task: models.Task = Depends(require_task_member)
):
    return crud.get_task_attachments(db=db, task_id=task_id)


@router.delete("/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attachment(
    attachment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    attachment = crud.get_attachment(db=db, attachment_id=attachment_id)
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    if attachment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own attachments")
    crud.delete_attachment(db=db, attachment_id=attachment_id)
    return None
