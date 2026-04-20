from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_provider
from app.models.provider import Provider
from app.models.agent import Agent
from app.schemas.provider import ProviderRegister, ProviderLogin, ProviderResponse, TokenResponse
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
