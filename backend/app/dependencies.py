import uuid
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, APIKeyHeader
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.provider import Provider
from app.models.consumer import Consumer
from app.models.api_key import ApiKey
from app.utils.auth import decode_token, hash_api_key

bearer_scheme = HTTPBearer()
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)


async def get_current_provider(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Provider:
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") != "provider":
            raise HTTPException(status_code=403, detail="Not a provider token")
        provider_id = uuid.UUID(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token")

    provider = await db.get(Provider, provider_id)
    if not provider:
        raise HTTPException(status_code=401, detail="Provider not found")
    return provider


async def get_current_consumer(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Consumer:
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("role") != "consumer":
            raise HTTPException(status_code=403, detail="Not a consumer token")
        consumer_id = uuid.UUID(payload["sub"])
    except (JWTError, ValueError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token")

    consumer = await db.get(Consumer, consumer_id)
    if not consumer:
        raise HTTPException(status_code=401, detail="Consumer not found")
    return consumer


async def get_consumer_by_api_key(
    authorization: str | None = Depends(api_key_header),
    db: AsyncSession = Depends(get_db),
) -> Consumer:
    if not authorization:
        raise HTTPException(status_code=401, detail="API key required")

    raw_key = authorization.removeprefix("Bearer ").strip()
    key_hash = hash_api_key(raw_key)

    result = await db.execute(
        select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")

    consumer = await db.get(Consumer, api_key.consumer_id)
    if not consumer:
        raise HTTPException(status_code=401, detail="Consumer not found")
    return consumer
