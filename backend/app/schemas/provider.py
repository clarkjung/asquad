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
    title: str | None = None
    bio: str | None = None
    years_experience: int | None = None
    linkedin_url: str | None = None
    specialty: str | None = None
    is_verified: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class ProviderPublicProfile(BaseModel):
    id: uuid.UUID
    company_name: str
    title: str | None = None
    bio: str | None = None
    years_experience: int | None = None
    linkedin_url: str | None = None
    specialty: str | None = None
    is_verified: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class ProviderProfileUpdate(BaseModel):
    title: str | None = None
    bio: str | None = None
    years_experience: int | None = None
    linkedin_url: str | None = None
    specialty: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    provider: ProviderResponse
