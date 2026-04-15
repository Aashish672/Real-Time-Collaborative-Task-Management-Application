"""
RabbitMQ connection manager for the application.

Provides:
- Connection lifecycle (startup/shutdown)
- Durable queue declarations
- get_channel() dependency for publishing messages
"""
import aio_pika
from decouple import config

RABBITMQ_URL = config("RABBITMQ_URL", default="amqp://guest:guest@localhost:5672/")

# Module-level connection — initialized on startup
_connection: aio_pika.abc.AbstractRobustConnection | None = None
_channel: aio_pika.abc.AbstractChannel | None = None

# Queue names
WEBHOOK_QUEUE = "webhooks_queue"
EMAIL_QUEUE = "email_queue"
WEBHOOK_DLQ = "webhooks_dead_letter_queue"


async def connect_rabbitmq():
    """Call during FastAPI lifespan startup."""
    global _connection, _channel

    _connection = await aio_pika.connect_robust(RABBITMQ_URL)
    _channel = await _connection.channel()

    # Declare durable queues (survive broker restarts)
    await _channel.declare_queue(WEBHOOK_QUEUE, durable=True)
    await _channel.declare_queue(EMAIL_QUEUE, durable=True)
    await _channel.declare_queue(WEBHOOK_DLQ, durable=True)

    print(f"✅ RabbitMQ connected: {RABBITMQ_URL}")


async def disconnect_rabbitmq():
    """Call during FastAPI lifespan shutdown."""
    global _connection, _channel
    if _channel:
        await _channel.close()
        _channel = None
    if _connection:
        await _connection.close()
        _connection = None
    print("🔌 RabbitMQ disconnected")


async def get_channel() -> aio_pika.abc.AbstractChannel:
    """FastAPI dependency — returns the shared channel for publishing."""
    if _channel is None:
        raise RuntimeError("RabbitMQ not initialized. Did the app start correctly?")
    return _channel
