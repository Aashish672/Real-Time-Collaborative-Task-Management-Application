"""
Email service — publishes email jobs to RabbitMQ for async delivery.

The actual sending is handled by the email_worker.py consumer process.
This module only publishes messages to the queue.
"""
import json
import aio_pika
from decouple import config

from app.core.rabbitmq import EMAIL_QUEUE

FRONTEND_URL = config("FRONTEND_URL")


async def publish_verification_email(
    channel: aio_pika.abc.AbstractChannel,
    email: str,
    user_name: str,
    verification_token: str,
):
    """Queue an email verification message."""
    verification_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"

    message_body = {
        "type": "email_verification",
        "to": email,
        "subject": "Verify your email — ProjectFlow",
        "context": {
            "user_name": user_name,
            "verification_link": verification_link,
        },
    }

    await channel.default_exchange.publish(
        aio_pika.Message(
            body=json.dumps(message_body).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        ),
        routing_key=EMAIL_QUEUE,
    )


async def publish_invitation_email(
    channel: aio_pika.abc.AbstractChannel,
    email: str,
    workspace_name: str,
    inviter_name: str,
    invite_token: str,
):
    """Queue a workspace invitation email."""
    invite_link = f"{FRONTEND_URL}/join/{invite_token}"

    message_body = {
        "type": "workspace_invitation",
        "to": email,
        "subject": f"You're invited to {workspace_name} — ProjectFlow",
        "context": {
            "workspace_name": workspace_name,
            "inviter_name": inviter_name,
            "invite_link": invite_link,
        },
    }

    await channel.default_exchange.publish(
        aio_pika.Message(
            body=json.dumps(message_body).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        ),
        routing_key=EMAIL_QUEUE,
    )
