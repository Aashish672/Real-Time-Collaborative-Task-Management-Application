from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List

from app import schemas, models, crud
from app.database import get_db
from app.dependencies import get_current_user
from app.dependencies.task import require_task_member


router=APIRouter(tags=["Comments"])


@router.post("/tasks/{task_id}/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    task_id: uuid.UUID,
    body: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    task: models.Task = Depends(require_task_member)
):
    return crud.create_comment(db=db, task_id=task_id, user_id=current_user.id, body=body)


@router.get("/tasks/{task_id}/comments", response_model=List[schemas.CommentResponse])
def get_task_comments(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    task: models.Task = Depends(require_task_member)
):
    return crud.get_task_comments(db=db, task_id=task_id)


@router.put("/comments/{comment_id}", response_model=schemas.CommentResponse)
def update_comment(
    comment_id: uuid.UUID,
    body: schemas.CommentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = crud.get_comment(db=db, comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own comments")
    return crud.update_comment(db=db, comment_id=comment_id, body=body)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = crud.get_comment(db=db, comment_id=comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own comments")
    crud.delete_comment(db=db, comment_id=comment_id)
    return None
