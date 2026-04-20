from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.agent import AgentResponse, AgentSearchResult
from app.services.discovery import search_agents, browse_agents, get_featured_agents

router = APIRouter(prefix="/api/v1/agents", tags=["discovery"])


@router.get("/search", response_model=list[AgentSearchResult])
async def search(
    q: str = Query(..., description="Natural language query"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    return await search_agents(db, q, limit)


@router.get("/browse", response_model=list[AgentResponse])
async def browse(
    category: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    agents = await browse_agents(db, category, limit, offset)
    return [AgentResponse.model_validate(a) for a in agents]


@router.get("/featured", response_model=list[AgentResponse])
async def featured(db: AsyncSession = Depends(get_db)):
    agents = await get_featured_agents(db)
    return [AgentResponse.model_validate(a) for a in agents]
