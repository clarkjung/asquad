import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, or_

from app.models.agent import Agent
from app.schemas.agent import AgentSearchResult, AgentResponse


async def search_agents(
    db: AsyncSession,
    query: str,
    limit: int = 10,
) -> list[AgentSearchResult]:
    # Keyword search using PostgreSQL full-text search across name, description, skills
    # TODO: replace with OpenAI embedding (text-embedding-3-small) for semantic search
    sql = text("""
        SELECT id,
               ts_rank(
                 to_tsvector('english', name || ' ' || description || ' ' || skills::text),
                 plainto_tsquery('english', :query)
               ) AS rank
        FROM agents
        WHERE status = 'active'
          AND to_tsvector('english', name || ' ' || description || ' ' || skills::text)
              @@ plainto_tsquery('english', :query)
        ORDER BY rank DESC
        LIMIT :limit
    """)
    rows = (await db.execute(sql, {"query": query, "limit": limit * 2})).fetchall()

    # Fall back to ILIKE if full-text returns nothing (e.g. single-char queries)
    if not rows:
        pattern = f"%{query}%"
        fallback = await db.execute(
            select(Agent).where(
                Agent.status == "active",
                or_(
                    Agent.name.ilike(pattern),
                    Agent.description.ilike(pattern),
                )
            ).limit(limit)
        )
        agents = list(fallback.scalars().all())
        return [AgentSearchResult(agent=AgentResponse.model_validate(a), score=0.5) for a in agents]

    max_calls = 1
    agent_map: dict = {}
    for row in rows:
        agent = await db.get(Agent, row.id)
        if agent and agent.status == "active":
            agent_map[row.id] = (agent, row.rank)
            if agent.total_calls > max_calls:
                max_calls = agent.total_calls

    results = []
    for agent_id, (agent, rank) in agent_map.items():
        norm_calls = math.log(agent.total_calls + 1) / math.log(max_calls + 1)
        score = 0.7 * float(rank) + 0.2 * norm_calls + 0.1 * agent.success_rate
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
