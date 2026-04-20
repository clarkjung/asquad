import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import uuid

from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate
from app.services.agent_card import generate_agent_card
from app.utils.encryption import encrypt
from app.utils.embedding import generate_embedding, build_agent_text


async def validate_endpoint(url: str) -> None:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url)
            if r.status_code >= 500:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Provider endpoint returned {r.status_code}",
                )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provider endpoint is unreachable",
        )


async def create_agent(
    db: AsyncSession,
    provider_id: uuid.UUID,
    data: AgentCreate,
    skip_health_check: bool = False,
) -> Agent:
    if not skip_health_check:
        await validate_endpoint(data.endpoint_url)

    agent_id = uuid.uuid4()
    agent_card = generate_agent_card(
        agent_id=agent_id,
        name=data.name,
        description=data.description,
        skills=data.skills,
        protocol_type=data.protocol_type,
    )

    encrypted_creds = None
    if data.auth_credentials:
        encrypted_creds = encrypt(data.auth_credentials)

    agent = Agent(
        id=agent_id,
        provider_id=provider_id,
        name=data.name,
        description=data.description,
        skills=data.skills,
        category=data.category,
        endpoint_url=data.endpoint_url,
        protocol_type=data.protocol_type,
        auth_type=data.auth_type,
        auth_credentials=encrypted_creds,
        agent_card=agent_card,
    )
    db.add(agent)
    await db.flush()

    try:
        text = build_agent_text(data.name, data.description, data.skills)
        embedding = await generate_embedding(text)
        agent.embedding = embedding
    except Exception:
        pass

    await db.commit()
    await db.refresh(agent)
    return agent


async def get_agent(db: AsyncSession, agent_id: uuid.UUID) -> Agent:
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


async def update_agent(
    db: AsyncSession, agent: Agent, data: AgentUpdate
) -> Agent:
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(agent, field, value)

    if any(f in update_data for f in ("name", "description", "skills")):
        try:
            text = build_agent_text(agent.name, agent.description, agent.skills)
            agent.embedding = await generate_embedding(text)
        except Exception:
            pass

        agent.agent_card = generate_agent_card(
            agent_id=agent.id,
            name=agent.name,
            description=agent.description,
            skills=agent.skills,
            protocol_type=agent.protocol_type,
        )

    await db.commit()
    await db.refresh(agent)
    return agent
