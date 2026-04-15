"""
Webhook service — hybrid mode.

- `dispatch_webhook()` — direct HTTP call (used for test/ping)
- `publish_webhook_to_queue()` — publishes to RabbitMQ (used in production flow)
- `trigger_workspace_webhooks()` — legacy sync dispatch (kept for backward compat)
"""
import json
import uuid

import httpx
import aio_pika
from sqlalchemy.orm import Session

from app import models
from app.core.rabbitmq import get_channel, WEBHOOK_QUEUE


def dispatch_webhook(url: str, event_type: str, payload: dict):
    """Direct HTTP dispatch — used for webhook test/ping button."""
    data = {
        "event": event_type,
        "data": payload,
    }

    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(url, json=data)
    except httpx.RequestError as e:
        print(f"Webhook delivery failed to {url}: {e}")


async def publish_webhook_to_queue(
    db: Session,
    workspace_id: uuid.UUID,
    event_type: str,
    payload: dict,
):
    """
    Fetch active webhooks for the workspace and publish each to RabbitMQ.
    The webhook_worker will handle actual delivery with retries.
    """
    webhooks = (
        db.query(models.Webhook)
        .filter(
            models.Webhook.workspace_id == workspace_id,
            models.Webhook.event_type == event_type,
            models.Webhook.is_active == True,
        )
        .all()
    )

    if not webhooks:
        return

    channel = await get_channel()

    for wh in webhooks:
        message_body = {
            "url": wh.url,
            "event": event_type,
            "data": payload,
            "webhook_id": str(wh.id),
            "retry_count": 0,
        }

        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(message_body).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key=WEBHOOK_QUEUE,
        )


def trigger_workspace_webhooks(db: Session, workspace_id: uuid.UUID, event_type: str, payload: dict):
    """Legacy synchronous dispatch — kept for backward compatibility."""
    webhooks = (
        db.query(models.Webhook)
        .filter(
            models.Webhook.workspace_id == workspace_id,
            models.Webhook.event_type == event_type,
            models.Webhook.is_active == True,
        )
        .all()
    )

    if not webhooks:
        return

    for wh in webhooks:
        dispatch_webhook(wh.url, event_type, payload)