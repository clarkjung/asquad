import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.models.consumer import Consumer


async def check_rate_limit(db: AsyncSession, consumer: Consumer) -> dict:
    """Returns current usage in last 60s and the consumer's RPM limit."""
    result = await db.execute(
        text("""
            SELECT COUNT(*) AS calls_last_minute
            FROM call_events
            WHERE consumer_id = :consumer_id
              AND time >= NOW() - INTERVAL '1 minute'
        """),
        {"consumer_id": str(consumer.id)},
    )
    row = result.fetchone()
    calls_last_minute = row.calls_last_minute if row else 0
    return {
        "calls_last_minute": int(calls_last_minute),
        "limit_rpm": consumer.rate_limit_rpm,
        "remaining": max(0, consumer.rate_limit_rpm - int(calls_last_minute)),
        "exceeded": int(calls_last_minute) >= consumer.rate_limit_rpm,
    }
