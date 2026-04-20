import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class ProviderRegister(BaseModel):
    email: EmailStr
    company_name: str
    password: str


class ProviderLogin(BaseModel):
    email: EmailStr
    password: str


class ProviderResponse(BaseModel):
    id: uuid.UUID
    email: str
    company_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    provider: ProviderResponse
