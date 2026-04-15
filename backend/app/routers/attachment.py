from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import uuid
import os
import shutil
from typing import List

from app import schemas, models, crud
from app.database import get_db
from app.dependencies import get_current_user
from app.dependencies.task import require_task_member


router=APIRouter(tags=["Attachments"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_CONTENT_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf", "text/plain", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip", "application/x-zip-compressed"
]

@router.post("/tasks/{task_id}/attachments/upload", response_model=schemas.AttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(
    task_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    task: models.Task = Depends(require_task_member)
):
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not supported."
        )

    # Validate file size (FastAPI doesn't do this automatically for spool files reliably without reading)
    # But we can check after reading a chunk or trust the SpooledTemporaryFile if available correctly.
    # For simplicity and safety, we'll read and check.
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Max 10MB."
        )
    
    # Seek back to 0 if needed (though we'll use 'content' now)
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("uploads", unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    # Base URL (for production, this should be configurable)
    # Assuming http://localhost:8000/uploads/ as prefix
    url = f"/uploads/{unique_filename}"

    body = schemas.AttachmentCreate(
        filename=file.filename,
        url=url
    )
    
    return crud.create_attachment(db=db, task_id=task_id, user_id=current_user.id, body=body)


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
    
    # Allow workspace admins or the uploader to delete? 
    # For now, stick to the uploader as in the existing code.
    if attachment.user_id and attachment.user_id != current_user.id:
         # Check if user is workspace admin could be an enhancement
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own attachments")
    
    # Physically delete file?
    if attachment.url.startswith("/uploads/"):
        file_path = os.path.join("uploads", os.path.basename(attachment.url))
        if os.path.exists(file_path):
            os.remove(file_path)

    crud.delete_attachment(db=db, attachment_id=attachment_id)
    return None
