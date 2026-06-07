import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, HttpUrl


class AgentCreate(BaseModel):
    name: str
    description: str
    skills: list[str]
    category: str = "General"
    endpoint_url: str
    protocol_type: Literal["a2a", "rest"] = "rest"
    auth_type: Literal["api_key", "bearer", "none"] = "none"
    auth_credentials: str | None = None


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    skills: list[str] | None = None
    category: str | None = None
    status: Literal["active", "paused", "inactive"] | None = None


class AgentResponse(BaseModel):
    id: uuid.UUID
    provider_id: uuid.UUID
    name: str
    description: str
    skills: list[str]
    category: str
    protocol_type: str
    auth_type: str
    agent_card: dict
    status: str
    total_calls: int
    avg_latency_ms: float
    success_rate: float
    created_at: datetime
    provider_name: str | None = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_agent(cls, agent: object) -> "AgentResponse":
        data = cls.model_validate(agent)
        if hasattr(agent, "provider") and agent.provider:
            data.provider_name = agent.provider.company_name
        return data


class AgentSearchResult(BaseModel):
    agent: AgentResponse
    score: float


class AgentStatsResponse(BaseModel):
    agent_id: uuid.UUID
    total_calls: int
    avg_latency_ms: float
    success_rate: float
    calls_today: int
    calls_this_week: int
    calls_this_month: int
    chart_data: list[int] = []
    chart_labels: list[str] = []
    recent_calls: list[dict] = []
