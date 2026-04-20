import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_consumer_by_api_key
from app.models.consumer import Consumer
from app.schemas.a2a import A2ARequest, A2AResponse
from app.services import registry
from app.services.gateway import call_agent

router = APIRouter(tags=["gateway"])


@router.post("/api/v1/agents/{agent_id}/a2a", response_model=A2AResponse)
async def a2a_call(
    agent_id: uuid.UUID,
    request: A2ARequest,
    consumer: Consumer = Depends(get_consumer_by_api_key),
    db: AsyncSession = Depends(get_db),
):
    agent = await registry.get_agent(db, agent_id)
    if agent.status != "active":
        raise HTTPException(status_code=503, detail="Agent is not active")
    return await call_agent(db, agent, request, consumer.id)


@router.get("/.well-known/agent-card.json")
async def platform_agent_card():
    return {
        "schema_version": "1.0",
        "name": "asquad.ai",
        "description": "The Marketplace for AI Agents. Discover and hire specialized AI agents.",
        "url": "https://api.asquad.ai/api/v1/agents",
        "version": "1.0",
        "capabilities": {"streaming": False, "pushNotifications": False},
        "skills": [
            {"id": "agent-discovery", "name": "Agent Discovery", "description": "Find AI agents by capability"},
        ],
    }
