import uuid

from sqlalchemy.orm import Session 
from app import models, schemas


def create_comment(db: Session, task_id: uuid.UUID, user_id: uuid.UUID, body: schemas.CommentCreate):
    new_comment = models.Comment(
        task_id=task_id,
        user_id=user_id,
        body=body.body
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


def get_task_comments(db: Session, task_id: uuid.UUID):
    return db.query(models.Comment).filter(models.Comment.task_id == task_id).order_by(models.Comment.created_at.desc()).all()


def get_comment(db: Session, comment_id: uuid.UUID):
    return db.query(models.Comment).filter(models.Comment.id == comment_id).first()


def update_comment(db: Session, comment_id: uuid.UUID, body: schemas.CommentUpdate):
    comment = get_comment(db, comment_id)
    if not comment:
        return None
    comment.body = body.body
    db.commit()
    db.refresh(comment)
    return comment


def delete_comment(db: Session, comment_id: uuid.UUID):
    comment = get_comment(db, comment_id)
    if not comment:
        return False
    db.delete(comment)
    db.commit()
    return True
