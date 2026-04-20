import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.models.agent import Agent
from app.schemas.agent import AgentSearchResult, AgentResponse
from app.utils.embedding import generate_embedding


async def search_agents(
    db: AsyncSession,
    query: str,
    limit: int = 10,
) -> list[AgentSearchResult]:
    embedding = await generate_embedding(query)
    vec_str = "[" + ",".join(str(x) for x in embedding) + "]"

    sql = text("""
        SELECT id, 1 - (embedding <=> :vec::vector) AS cosine_sim
        FROM agents
        WHERE status = 'active' AND embedding IS NOT NULL
        ORDER BY embedding <=> :vec::vector
        LIMIT :limit
    """)
    rows = (await db.execute(sql, {"vec": vec_str, "limit": limit * 2})).fetchall()

    if not rows:
        return []

    max_calls = 1
    results = []
    for row in rows:
        agent = await db.get(Agent, row.id)
        if agent and agent.status == "active":
            if agent.total_calls > max_calls:
                max_calls = agent.total_calls

    for row in rows:
        agent = await db.get(Agent, row.id)
        if not agent or agent.status != "active":
            continue
        norm_calls = math.log(agent.total_calls + 1) / math.log(max_calls + 1)
        score = 0.7 * row.cosine_sim + 0.2 * norm_calls + 0.1 * agent.success_rate
        results.append(AgentSearchResult(agent=AgentResponse.model_validate(agent), score=round(score, 4)))

    results.sort(key=lambda r: r.score, reverse=True)
    return results[:limit]


async def browse_agents(
    db: AsyncSession,
    category: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[Agent]:
    q = select(Agent).where(Agent.status == "active")
    if category:
        q = q.where(Agent.category == category)
    q = q.order_by(Agent.total_calls.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_featured_agents(db: AsyncSession, limit: int = 8) -> list[Agent]:
    q = (
        select(Agent)
        .where(Agent.status == "active")
        .order_by(Agent.total_calls.desc())
        .limit(limit)
    )
    result = await db.execute(q)
    return list(result.scalars().all())
