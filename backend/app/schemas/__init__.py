from app.schemas.provider import ProviderRegister, ProviderLogin, ProviderResponse, TokenResponse
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse, AgentSearchResult, AgentStatsResponse
from app.schemas.consumer import (
    ConsumerRegister, ConsumerLogin, ConsumerResponse, ConsumerTokenResponse,
    ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse, ConsumerUsageResponse,
)
from app.schemas.a2a import A2ARequest, A2AResponse, A2ATaskResult
