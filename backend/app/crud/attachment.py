import uuid

from sqlalchemy.orm import Session 
from app import models, schemas


def create_attachment(db: Session, task_id: uuid.UUID, user_id: uuid.UUID, body: schemas.AttachmentCreate):
    attachment = models.Attachment(
        task_id=task_id,
        user_id=user_id,
        filename=body.filename,
        url=body.url
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


def get_task_attachments(db: Session, task_id: uuid.UUID):
    return db.query(models.Attachment).filter(models.Attachment.task_id == task_id).all()


def get_attachment(db: Session, attachment_id: uuid.UUID):
    return db.query(models.Attachment).filter(models.Attachment.id == attachment_id).first()


def delete_attachment(db: Session, attachment_id: uuid.UUID):
    attachment = get_attachment(db, attachment_id)
    if not attachment:
        return False
    db.delete(attachment)
    db.commit()
    return True
