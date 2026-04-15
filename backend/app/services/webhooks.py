import httpx
import uuid
from sqlalchemy.orm import Session
from app import models

def dispatch_webhook(url: str, event_type: str, payload: dict):
    """Sends a POST request to the registered URL."""
    data = {
        "event": event_type,
        "data": payload
    }
    
    try:
        # Fire and forget. A timeout prevents it from hanging indefinitely.
        with httpx.Client(timeout=5.0) as client:
            client.post(url, json=data)
    except httpx.RequestError as e:
        # In a massive enterprise app, you'd log this and trigger a retry.
        # For this project, a simple print/log is enough.
        print(f"Webhook delivery failed to {url}: {e}")

def trigger_workspace_webhooks(db: Session, workspace_id: uuid.UUID, event_type: str, payload: dict):
    """Fetches all active webhooks for a workspace and event type, then dispatches them."""
    webhooks = db.query(models.Webhook).filter(
        models.Webhook.workspace_id == workspace_id,
        models.Webhook.event_type == event_type,
        models.Webhook.is_active == True
    ).all()
    
    if not webhooks:
        return
        
    for wh in webhooks:
        dispatch_webhook(wh.url, event_type, payload)