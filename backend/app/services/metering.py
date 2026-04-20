import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func

from app.models.agent import Agent


async def record_call(
    db: AsyncSession,
    consumer_id: uuid.UUID,
    agent_id: uuid.UUID,
    request_tokens: int,
    response_tokens: int,
    latency_ms: int,
    status: str,
    error_message: str | None = None,
) -> None:
    await db.execute(
        text("""
            INSERT INTO call_events
              (time, consumer_id, agent_id, request_tokens, response_tokens,
               latency_ms, status, error_message)
            VALUES
              (:time, :consumer_id, :agent_id, :request_tokens, :response_tokens,
               :latency_ms, :status, :error_message)
        """),
        {
            "time": datetime.now(timezone.utc),
            "consumer_id": str(consumer_id),
            "agent_id": str(agent_id),
            "request_tokens": request_tokens,
            "response_tokens": response_tokens,
            "latency_ms": latency_ms,
            "status": status,
            "error_message": error_message,
        },
    )
    await db.commit()

    if status == "success":
        await _update_agent_stats(db, agent_id, latency_ms, success=True)
    else:
        await _update_agent_stats(db, agent_id, latency_ms, success=False)


async def _update_agent_stats(
    db: AsyncSession, agent_id: uuid.UUID, latency_ms: int, success: bool
) -> None:
    agent = await db.get(Agent, agent_id)
    if not agent:
        return
    agent.total_calls += 1
    alpha = 0.1
    agent.avg_latency_ms = (1 - alpha) * agent.avg_latency_ms + alpha * latency_ms
    if success:
        agent.success_rate = (1 - alpha) * agent.success_rate + alpha * 1.0
    else:
        agent.success_rate = (1 - alpha) * agent.success_rate
    await db.commit()


async def get_agent_stats(db: AsyncSession, agent_id: uuid.UUID) -> dict:
    base = text("""
        SELECT
            COUNT(*) FILTER (WHERE time >= NOW() - INTERVAL '1 day') AS calls_today,
            COUNT(*) FILTER (WHERE time >= NOW() - INTERVAL '7 days') AS calls_week,
            COUNT(*) FILTER (WHERE time >= NOW() - INTERVAL '30 days') AS calls_month
        FROM call_events
        WHERE agent_id = :agent_id
    """)
    row = (await db.execute(base, {"agent_id": str(agent_id)})).fetchone()
    agent = await db.get(Agent, agent_id)

    # 7-day chart: calls per day for last 7 days
    chart_sql = text("""
        SELECT
            TO_CHAR(DATE_TRUNC('day', time AT TIME ZONE 'UTC'), 'Dy') AS day_label,
            COUNT(*) AS cnt
        FROM call_events
        WHERE agent_id = :agent_id
          AND time >= NOW() - INTERVAL '7 days'
        GROUP BY DATE_TRUNC('day', time AT TIME ZONE 'UTC'), day_label
        ORDER BY DATE_TRUNC('day', time AT TIME ZONE 'UTC')
    """)
    chart_rows = (await db.execute(chart_sql, {"agent_id": str(agent_id)})).fetchall()
    chart_map = {r.day_label: int(r.cnt) for r in chart_rows}

    from datetime import date, timedelta
    labels = []
    data = []
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        label = d.strftime("%a")
        labels.append(label)
        data.append(chart_map.get(label, 0))

    # Recent calls: last 10 events
    recent_sql = text("""
        SELECT
            time,
            consumer_id::text,
            status,
            latency_ms,
            error_message
        FROM call_events
        WHERE agent_id = :agent_id
        ORDER BY time DESC
        LIMIT 10
    """)
    recent_rows = (await db.execute(recent_sql, {"agent_id": str(agent_id)})).fetchall()
    recent_calls = [
        {
            "time": r.time.isoformat(),
            "consumer": r.consumer_id[:8],
            "status": r.status,
            "latency_ms": r.latency_ms,
            "error_message": r.error_message,
        }
        for r in recent_rows
    ]

    return {
        "agent_id": agent_id,
        "total_calls": agent.total_calls if agent else 0,
        "avg_latency_ms": agent.avg_latency_ms if agent else 0,
        "success_rate": agent.success_rate if agent else 1.0,
        "calls_today": row.calls_today if row else 0,
        "calls_this_week": row.calls_week if row else 0,
        "calls_this_month": row.calls_month if row else 0,
        "chart_data": data,
        "chart_labels": labels,
        "recent_calls": recent_calls,
    }


async def get_consumer_usage(db: AsyncSession, consumer_id: uuid.UUID) -> dict:
    sql = text("""
        SELECT
            COUNT(*) AS total_calls,
            COUNT(*) FILTER (WHERE time >= NOW() - INTERVAL '1 day') AS calls_today,
            COUNT(*) FILTER (WHERE time >= NOW() - INTERVAL '7 days') AS calls_week,
            COUNT(*) FILTER (WHERE time >= NOW() - INTERVAL '30 days') AS calls_month
        FROM call_events
        WHERE consumer_id = :consumer_id
    """)
    row = (await db.execute(sql, {"consumer_id": str(consumer_id)})).fetchone()

    top_sql = text("""
        SELECT agent_id::text, COUNT(*) AS cnt
        FROM call_events
        WHERE consumer_id = :consumer_id
        GROUP BY agent_id
        ORDER BY cnt DESC
        LIMIT 5
    """)
    top_rows = (await db.execute(top_sql, {"consumer_id": str(consumer_id)})).fetchall()

    # 7-day chart
    chart_sql = text("""
        SELECT
            TO_CHAR(DATE_TRUNC('day', time AT TIME ZONE 'UTC'), 'Dy') AS day_label,
            COUNT(*) AS cnt
        FROM call_events
        WHERE consumer_id = :consumer_id
          AND time >= NOW() - INTERVAL '7 days'
        GROUP BY DATE_TRUNC('day', time AT TIME ZONE 'UTC'), day_label
        ORDER BY DATE_TRUNC('day', time AT TIME ZONE 'UTC')
    """)
    chart_rows = (await db.execute(chart_sql, {"consumer_id": str(consumer_id)})).fetchall()
    chart_map = {r.day_label: int(r.cnt) for r in chart_rows}

    from datetime import date, timedelta
    labels, data = [], []
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        label = d.strftime("%a")
        labels.append(label)
        data.append(chart_map.get(label, 0))

    return {
        "total_calls": row.total_calls if row else 0,
        "calls_today": row.calls_today if row else 0,
        "calls_this_week": row.calls_week if row else 0,
        "calls_this_month": row.calls_month if row else 0,
        "top_agents": [{"agent_id": r.agent_id, "call_count": r.cnt} for r in top_rows],
        "chart_data": data,
        "chart_labels": labels,
    }
