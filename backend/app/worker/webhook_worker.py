"""
Webhook delivery worker — standalone process.

Consumes from `webhooks_queue`, dispatches HTTP POST to target URLs.
Implements exponential backoff retry (up to 3 attempts).
Failed messages after 3 retries are routed to the dead-letter queue.

Run: python -m app.worker.webhook_worker
"""
import asyncio
import json
import logging

import aio_pika
import httpx
from decouple import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [WEBHOOK] %(message)s")
logger = logging.getLogger(__name__)

RABBITMQ_URL = config("RABBITMQ_URL", default="amqp://guest:guest@localhost:5672/")
WEBHOOK_QUEUE = "webhooks_queue"
WEBHOOK_DLQ = "webhooks_dead_letter_queue"

MAX_RETRIES = 3
BACKOFF_BASE = 5  # seconds: 5, 25, 125


async def process_webhook(message: aio_pika.abc.AbstractIncomingMessage):
    """Process a single webhook delivery message."""
    async with message.process(requeue=False):
        body = json.loads(message.body.decode())
        url = body.get("url")
        event_type = body.get("event")
        payload = body.get("data", {})
        retry_count = body.get("retry_count", 0)

        logger.info(f"Delivering webhook to {url} | event={event_type} | attempt={retry_count + 1}")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json={"event": event_type, "data": payload})
                response.raise_for_status()

            logger.info(f"✅ Webhook delivered to {url} | status={response.status_code}")

        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            logger.warning(f"❌ Delivery failed to {url}: {e}")

            if retry_count < MAX_RETRIES - 1:
                # Re-publish with incremented retry count + backoff delay
                backoff = BACKOFF_BASE ** (retry_count + 1)
                logger.info(f"⏳ Retrying in {backoff}s (attempt {retry_count + 2}/{MAX_RETRIES})")
                await asyncio.sleep(backoff)

                body["retry_count"] = retry_count + 1
                channel = message.channel
                await channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(body).encode(),
                        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    ),
                    routing_key=WEBHOOK_QUEUE,
                )
            else:
                # Max retries exhausted — send to dead-letter queue
                logger.error(f"💀 Max retries exhausted for {url}. Moving to DLQ.")
                channel = message.channel
                await channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(body).encode(),
                        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    ),
                    routing_key=WEBHOOK_DLQ,
                )


async def main():
    logger.info("🚀 Webhook worker starting...")

    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel = await connection.channel()

    # Fair dispatch — process one message at a time
    await channel.set_qos(prefetch_count=1)

    queue = await channel.declare_queue(WEBHOOK_QUEUE, durable=True)

    logger.info(f"📡 Listening on queue: {WEBHOOK_QUEUE}")

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            await process_webhook(message)


if __name__ == "__main__":
    asyncio.run(main())
