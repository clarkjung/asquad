import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_provider
from app.models.provider import Provider
from app.models.agent import Agent
from app.schemas.provider import ProviderRegister, ProviderLogin, ProviderResponse, ProviderPublicProfile, ProviderProfileUpdate, TokenResponse
from app.schemas.agent import AgentResponse
from app.utils.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/v1/providers", tags=["providers"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: ProviderRegister, db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(Provider).where(Provider.email == data.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    provider = Provider(
        email=data.email,
        company_name=data.company_name,
        password_hash=hash_password(data.password),
    )
    db.add(provider)
    await db.commit()
    await db.refresh(provider)

    token = create_access_token(str(provider.id), role="provider")
    return TokenResponse(access_token=token, provider=ProviderResponse.model_validate(provider))


@router.post("/login", response_model=TokenResponse)
async def login(data: ProviderLogin, db: AsyncSession = Depends(get_db)):
    provider = (await db.execute(select(Provider).where(Provider.email == data.email))).scalar_one_or_none()
    if not provider or not verify_password(data.password, provider.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(provider.id), role="provider")
    return TokenResponse(access_token=token, provider=ProviderResponse.model_validate(provider))


@router.get("/me", response_model=ProviderResponse)
async def get_me(provider: Provider = Depends(get_current_provider)):
    return provider


@router.get("/my-agents", response_model=list[AgentResponse])
async def my_agents(
    provider: Provider = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent)
        .where(Agent.provider_id == provider.id, Agent.status != "inactive")
        .order_by(Agent.created_at.desc())
    )
    return list(result.scalars().all())


@router.put("/me/profile", response_model=ProviderResponse)
async def update_profile(
    data: ProviderProfileUpdate,
    provider: Provider = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(provider, field, value)
    await db.commit()
    await db.refresh(provider)
    return provider


@router.get("/{provider_id}/profile", response_model=ProviderPublicProfile)
async def get_public_profile(provider_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    provider = (await db.execute(select(Provider).where(Provider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.get("/{provider_id}/agents", response_model=list[AgentResponse])
async def get_provider_agents(provider_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Agent)
        .where(Agent.provider_id == provider_id, Agent.status == "active")
        .order_by(Agent.total_calls.desc())
    )
    return list(result.scalars().all())


class SkillAgentCreate(BaseModel):
    name: str
    description: str
    category: str = "General"
    skills: list[str] = []
    skill_prompt: str


@router.post("/skill-agents", response_model=AgentResponse, status_code=201)
async def create_skill_agent(
    data: SkillAgentCreate,
    provider: Provider = Depends(get_current_provider),
    db: AsyncSession = Depends(get_db),
):
    agent_id = uuid.uuid4()
    endpoint_url = f"{settings.api_public_url}/v1/skills/{agent_id}/a2a"

    agent = Agent(
        id=agent_id,
        provider_id=provider.id,
        name=data.name,
        description=data.description,
        skills=data.skills,
        category=data.category,
        protocol_type="a2a",
        endpoint_url=endpoint_url,
        skill_prompt=data.skill_prompt,
        status="active",
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent
