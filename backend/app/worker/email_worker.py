"""
Email delivery worker — standalone process.

Consumes from `email_queue`, sends emails via SMTP (Gmail/SendGrid/etc).
Handles two email types:
  - email_verification: Account verification link
  - workspace_invitation: Workspace invite link

Run: python -m app.worker.email_worker
"""
import asyncio
import json
import logging

import aio_pika
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from decouple import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [EMAIL] %(message)s")
logger = logging.getLogger(__name__)

RABBITMQ_URL = config("RABBITMQ_URL", default="amqp://guest:guest@localhost:5672/")
EMAIL_QUEUE = "email_queue"

# SMTP config
MAIL_SERVER = config("MAIL_SERVER", default="smtp.gmail.com")
MAIL_PORT = config("MAIL_PORT", default=587, cast=int)
MAIL_USERNAME = config("MAIL_USERNAME", default="")
MAIL_PASSWORD = config("MAIL_PASSWORD", default="")
MAIL_FROM = config("MAIL_FROM", default="noreply@projectflow.io")


def build_verification_html(user_name: str, verification_link: str) -> str:
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #6366f1; font-size: 28px; margin: 0;">ProjectFlow</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px;">
            <h2 style="color: #111827; margin-top: 0;">Verify your email</h2>
            <p style="color: #6b7280; line-height: 1.6;">
                Hi {user_name},<br><br>
                Thanks for signing up for ProjectFlow! Please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{verification_link}" 
                   style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 10px; 
                          text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                    Verify Email Address
                </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px;">
                If you didn't create this account, you can safely ignore this email.
            </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            © 2026 ProjectFlow. All rights reserved.
        </p>
    </div>
    """


def build_invitation_html(workspace_name: str, inviter_name: str, invite_link: str) -> str:
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #6366f1; font-size: 28px; margin: 0;">ProjectFlow</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px;">
            <h2 style="color: #111827; margin-top: 0;">You're invited!</h2>
            <p style="color: #6b7280; line-height: 1.6;">
                <strong>{inviter_name}</strong> has invited you to join 
                <strong>{workspace_name}</strong> on ProjectFlow.
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{invite_link}" 
                   style="background: #6366f1; color: white; padding: 14px 32px; border-radius: 10px; 
                          text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                    Accept Invitation
                </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px;">
                This invitation will expire in 7 days. If you don't have a ProjectFlow account, 
                you'll be able to create one when you accept.
            </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            © 2026 ProjectFlow. All rights reserved.
        </p>
    </div>
    """


async def send_email(to: str, subject: str, html_body: str):
    """Send an email via SMTP."""
    message = MIMEMultipart("alternative")
    message["From"] = MAIL_FROM
    message["To"] = to
    message["Subject"] = subject
    message.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=MAIL_SERVER,
            port=MAIL_PORT,
            username=MAIL_USERNAME,
            password=MAIL_PASSWORD,
            start_tls=True,
        )
        logger.info(f"✅ Email sent to {to}: {subject}")
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to}: {e}")
        raise


async def process_email(message: aio_pika.abc.AbstractIncomingMessage):
    """Process a single email message from the queue."""
    async with message.process(requeue=True):
        body = json.loads(message.body.decode())
        email_type = body.get("type")
        to = body.get("to")
        subject = body.get("subject", "ProjectFlow Notification")
        context = body.get("context", {})

        if email_type == "email_verification":
            html = build_verification_html(
                user_name=context.get("user_name", "User"),
                verification_link=context.get("verification_link", "#"),
            )
        elif email_type == "workspace_invitation":
            html = build_invitation_html(
                workspace_name=context.get("workspace_name", "Workspace"),
                inviter_name=context.get("inviter_name", "Someone"),
                invite_link=context.get("invite_link", "#"),
            )
        else:
            logger.warning(f"Unknown email type: {email_type}")
            return

        await send_email(to=to, subject=subject, html_body=html)


async def main():
    logger.info("🚀 Email worker starting...")

    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)

    queue = await channel.declare_queue(EMAIL_QUEUE, durable=True)

    logger.info(f"📡 Listening on queue: {EMAIL_QUEUE}")

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            await process_email(message)


if __name__ == "__main__":
    asyncio.run(main())
