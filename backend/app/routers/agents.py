import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_provider
from app.models.provider import Provider
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse, AgentStatsResponse
from app.services import registry
from app.services.metering import get_agent_stats

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


class EndpointValidateRequest(BaseModel):
    url: str


@router.post("/validate-endpoint")
async def validate_endpoint(data: EndpointValidateRequest):
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(data.url)
            return {"ok": True, "status_code": r.status_code}
    except Exception:
        return {"ok": False, "status_code": None}


@router.post("", response_model=AgentResponse, status_code=201)
async def create_agent(
    data: AgentCreate,
    provider: Provider = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db),
):
    return await registry.create_agent(db, provider.id, data)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    agent = await registry.get_agent(db, agent_id)
    return AgentResponse.from_agent(agent)


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: uuid.UUID,
    data: AgentUpdate,
    provider: Provider = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db),
):
    agent = await registry.get_agent(db, agent_id)
    if agent.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not your agent")
    return await registry.update_agent(db, agent, data)


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: uuid.UUID,
    provider: Provider = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db),
):
    agent = await registry.get_agent(db, agent_id)
    if agent.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not your agent")
    agent.status = "inactive"
    await db.commit()


@router.get("/{agent_id}/stats", response_model=AgentStatsResponse)
async def agent_stats(
    agent_id: uuid.UUID,
    provider: Provider = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db),
):
    agent = await registry.get_agent(db, agent_id)
    if agent.provider_id != provider.id:
        raise HTTPException(status_code=403, detail="Not your agent")
    return await get_agent_stats(db, agent_id)


@router.get("/{agent_id}/agent-card")
async def get_agent_card(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    agent = await registry.get_agent(db, agent_id)
    return agent.agent_card
