import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    provider_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("providers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    category: Mapped[str] = mapped_column(String(100), nullable=False, default="General")
    endpoint_url: Mapped[str] = mapped_column(String(500), nullable=False)
    protocol_type: Mapped[str] = mapped_column(String(10), nullable=False, default="rest")
    auth_type: Mapped[str] = mapped_column(String(20), nullable=False, default="none")
    auth_credentials: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_card: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    embedding: Mapped[list | None] = mapped_column(Vector(1536), nullable=True)
    skill_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    total_calls: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    success_rate: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    provider: Mapped["Provider"] = relationship("Provider", back_populates="agents")
