import uuid

from sqlalchemy.orm import Session 
from app import models, schemas


def create_label(db: Session, workspace_id: uuid.UUID, body: schemas.LabelCreate):
    label = models.Label(
        workspace_id=workspace_id,
        name=body.name,
        color=body.color or "#3B82F6"
    )
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


def get_label(db: Session, label_id: uuid.UUID):
    return db.query(models.Label).filter(models.Label.id == label_id).first()


def list_workspace_labels(db: Session, workspace_id: uuid.UUID):
    return db.query(models.Label).filter(models.Label.workspace_id == workspace_id).all()


def update_label(db: Session, label_id: uuid.UUID, body: schemas.LabelUpdate):
    label = get_label(db, label_id)
    if not label:
        return None
    if body.name is not None:
        label.name = body.name
    if body.color is not None:
        label.color = body.color
    db.commit()
    db.refresh(label)
    return label


def delete_label(db: Session, label_id: uuid.UUID):
    label = get_label(db, label_id)
    if not label:
        return False
    db.delete(label)
    db.commit()
    return True
