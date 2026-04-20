from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.dependencies import get_current_consumer
from app.models.consumer import Consumer
from app.models.api_key import ApiKey
from app.schemas.consumer import (
    ConsumerRegister, ConsumerLogin, ConsumerResponse, ConsumerTokenResponse,
    ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse, ConsumerUsageResponse,
)
from app.utils.auth import hash_password, verify_password, create_access_token, generate_api_key
from app.services.metering import get_consumer_usage
from app.services.rate_limit import check_rate_limit

router = APIRouter(prefix="/api/v1/consumers", tags=["consumers"])


@router.post("/register", response_model=ConsumerTokenResponse, status_code=201)
async def register(data: ConsumerRegister, db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(Consumer).where(Consumer.email == data.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    consumer = Consumer(
        email=data.email,
        company_name=data.company_name,
        password_hash=hash_password(data.password),
    )
    db.add(consumer)
    await db.commit()
    await db.refresh(consumer)

    token = create_access_token(str(consumer.id), role="consumer")
    return ConsumerTokenResponse(access_token=token, consumer=ConsumerResponse.model_validate(consumer))


@router.post("/login", response_model=ConsumerTokenResponse)
async def login(data: ConsumerLogin, db: AsyncSession = Depends(get_db)):
    consumer = (await db.execute(select(Consumer).where(Consumer.email == data.email))).scalar_one_or_none()
    if not consumer or not verify_password(data.password, consumer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(consumer.id), role="consumer")
    return ConsumerTokenResponse(access_token=token, consumer=ConsumerResponse.model_validate(consumer))


@router.post("/api-keys", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_api_key(
    data: ApiKeyCreate,
    consumer: Consumer = Depends(get_current_consumer),
    db: AsyncSession = Depends(get_db),
):
    raw_key, key_hash, prefix = generate_api_key()
    api_key = ApiKey(
        consumer_id=consumer.id,
        key_hash=key_hash,
        key_prefix=prefix,
        name=data.name,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    return ApiKeyCreatedResponse(**ApiKeyResponse.model_validate(api_key).model_dump(), raw_key=raw_key)


@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    consumer: Consumer = Depends(get_current_consumer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApiKey).where(ApiKey.consumer_id == consumer.id).order_by(ApiKey.created_at.desc())
    )
    return list(result.scalars().all())


@router.delete("/api-keys/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: uuid.UUID,
    consumer: Consumer = Depends(get_current_consumer),
    db: AsyncSession = Depends(get_db),
):
    api_key = await db.get(ApiKey, key_id)
    if not api_key or api_key.consumer_id != consumer.id:
        raise HTTPException(status_code=404, detail="API key not found")
    api_key.is_active = False
    await db.commit()


@router.get("/usage", response_model=ConsumerUsageResponse)
async def usage(
    consumer: Consumer = Depends(get_current_consumer),
    db: AsyncSession = Depends(get_db),
):
    usage_data = await get_consumer_usage(db, consumer.id)
    rate = await check_rate_limit(db, consumer)
    return {
        **usage_data,
        "calls_last_minute": rate["calls_last_minute"],
        "limit_rpm": rate["limit_rpm"],
        "remaining_rpm": rate["remaining"],
    }
