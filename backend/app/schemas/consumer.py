import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class ConsumerRegister(BaseModel):
    email: EmailStr
    company_name: str
    password: str


class ConsumerLogin(BaseModel):
    email: EmailStr
    password: str


class ConsumerResponse(BaseModel):
    id: uuid.UUID
    email: str
    company_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConsumerTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    consumer: ConsumerResponse


class ApiKeyCreate(BaseModel):
    name: str


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    consumer_id: uuid.UUID
    key_prefix: str
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreatedResponse(ApiKeyResponse):
    raw_key: str


class ConsumerUsageResponse(BaseModel):
    total_calls: int
    calls_today: int
    calls_this_week: int
    calls_this_month: int
    top_agents: list[dict]
    calls_last_minute: int
    limit_rpm: int
    remaining_rpm: int
