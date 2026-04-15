import uuid
from typing import Optional, Any
from sqlalchemy.orm import Session
from app import models, crud
from app.services.socket_manager import manager
from app.services.webhooks import trigger_workspace_webhooks
from datetime import datetime, timezone

class ActivityService:
    @staticmethod
    async def log_activity(
        db: Session,
        workspace_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        action: models.ActivityAction,
        entity_type: str,
        entity_id: Optional[uuid.UUID] = None,
        project_id: Optional[uuid.UUID] = None,
        payload: Optional[dict[str, Any]] = None,
        trigger_notification: bool = False,
        recipient_id: Optional[uuid.UUID] = None
    ):
        # 1. Create Activity Entry
        activity = models.Activity(
            workspace_id=workspace_id,
            project_id=project_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            payload=payload,
            created_at=datetime.now(timezone.utc)
        )
        db.add(activity)
        db.commit()
        db.refresh(activity)

        # 2. Handle Cleanup Policy
        # User requested: "For actvity delete after a certain period like once the task is done."
        if action == models.ActivityAction.completed and entity_type == "task":
             ActivityService.cleanup_task_activity(db, entity_id)

        # 3. Handle High Priority Notifications
        if trigger_notification and recipient_id and recipient_id != user_id:
            # We use crud.create_notification (assuming it exists based on previous implementation)
            notification = crud.create_notification(
                db=db,
                user_id=recipient_id,
                notification_type=ActivityService._get_notification_type(action, entity_type),
                payload={
                    "activity_id": str(activity.id),
                    "action": action,
                    "entity_type": entity_type,
                    "entity_id": str(entity_id),
                    "actor_name": activity.user.full_name if activity.user else "System",
                    "workspace_id": str(workspace_id),
                    "project_id": str(project_id) if project_id else None,
                    **(payload or {})
                }
            )
            
            # 4. Push real-time notification via WebSocket
            await manager.broadcast_to_workspace(
                workspace_id=workspace_id,
                message={
                    "type": "NOTIFICATION_RECEIVED",
                    "recipient_id": str(recipient_id),
                    "notification_id": str(notification.id)
                }
            )

        # Broadcast the activity to update feed in real-time
        await manager.broadcast_to_workspace(
            workspace_id=workspace_id,
            message={
                "type": "ACTIVITY_LOGGED",
                "activity_id": str(activity.id)
            }
        )

        # 5. Trigger Webhooks
        webhook_event = ActivityService._get_webhook_event(action, entity_type)
        if webhook_event:
            # Construct a useful payload for the webhook
            webhook_payload = {
                "activity_id": str(activity.id),
                "action": action,
                "entity_type": entity_type,
                "entity_id": str(entity_id) if entity_id else None,
                "actor_name": activity.user.full_name if activity.user else "System",
                "timestamp": activity.created_at.isoformat(),
                "payload": payload or {}
            }
            trigger_workspace_webhooks(db, workspace_id, webhook_event, webhook_payload)

        return activity

    @staticmethod
    def cleanup_task_activity(db: Session, task_id: uuid.UUID):
        """Purge move/update logs for a completed task to save space."""
        # Keep 'created' and 'completed', delete intermediate 'moved' or 'updated'
        db.query(models.Activity).filter(
            models.Activity.entity_type == "task",
            models.Activity.entity_id == task_id,
            models.Activity.action.in_([models.ActivityAction.moved, models.ActivityAction.updated])
        ).delete(synchronize_session=False)
        db.commit()

    @staticmethod
    def _get_webhook_event(action: models.ActivityAction, entity_type: str) -> Optional[str]:
        """Maps internal activity actions to external webhook event types."""
        mapping = {
            (models.ActivityAction.created, "task"): "task.created",
            (models.ActivityAction.completed, "task"): "task.completed",
            (models.ActivityAction.moved, "task"): "task.status_changed",
            (models.ActivityAction.assigned, "task"): "task.assigned",
            (models.ActivityAction.commented, "task"): "comment.added",
            (models.ActivityAction.created, "invitation"): "member.invited",
        }
        return mapping.get((action, entity_type))

    @staticmethod
    def _get_notification_type(action: models.ActivityAction, entity_type: str):
        if action == models.ActivityAction.assigned:
            return models.NotificationType.task_assigned
        if action == models.ActivityAction.commented:
            return models.NotificationType.comment_mentioned
        return models.NotificationType.project_updated
