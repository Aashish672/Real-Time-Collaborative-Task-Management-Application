import uuid
from typing import Any

from sqlalchemy.orm import Session 
from app import models, schemas


def get_user_notifications(db: Session, user_id: uuid.UUID):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.created_at.desc()).all()


def get_unread_count(db: Session, user_id: uuid.UUID):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False
    ).count()


def mark_notification_read(db: Session, notification_id: uuid.UUID):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notification:
        return None
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: uuid.UUID):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return True


def delete_notification(db: Session, notification_id: uuid.UUID):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notification:
        return False
    db.delete(notification)
    db.commit()
    return True


def create_notification(
    db: Session,
    user_id: uuid.UUID,
    notification_type: models.NotificationType,
    payload: dict[str, Any]
):
    notification = models.Notification(
        user_id=user_id,
        type=notification_type,
        payload=payload
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
