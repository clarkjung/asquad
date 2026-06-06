from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import providers, agents, consumers, discovery, gateway, skills

app = FastAPI(
    title="asquad.ai API",
    description="The Marketplace for AI Agents",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers.router)
app.include_router(discovery.router)  # before agents to prevent /featured matching /{agent_id}
app.include_router(agents.router)
app.include_router(consumers.router)
app.include_router(gateway.router)
app.include_router(skills.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/admin/seed-skill-agents")
async def seed_skill_agents():
    from app.database import AsyncSessionLocal
    from app.models import Provider, Agent
    import uuid, hashlib

    async with AsyncSessionLocal() as db:
        provider_id = uuid.uuid5(uuid.NAMESPACE_DNS, "demo@asquad.ai")
        existing = await db.get(Provider, provider_id)
        if not existing:
            db.add(Provider(
                id=provider_id,
                email="demo@asquad.ai",
                company_name="asquad.ai",
                password_hash=hashlib.sha256(b"demo").hexdigest(),
            ))

        agent_id = uuid.uuid5(uuid.NAMESPACE_DNS, "asquad-code-reviewer-v1")
        existing_agent = await db.get(Agent, agent_id)
        if not existing_agent:
            db.add(Agent(
                id=agent_id,
                provider_id=provider_id,
                name="Code Reviewer",
                description="Senior engineer code review: catches security vulnerabilities, performance issues, and logic bugs. Returns structured feedback with severity levels and fix examples.",
                skills=["code-review", "security-audit", "performance", "best-practices"],
                category="Engineering",
                protocol_type="a2a",
                endpoint_url="https://api.asquad.ai/v1/skills/code_review/a2a",
                total_calls=0,
                avg_latency_ms=1200,
                success_rate=0.99,
                status="active",
            ))
            await db.commit()
            return {"created": True, "agent_id": str(agent_id)}

        await db.commit()
        return {"created": False, "agent_id": str(agent_id), "note": "already exists"}
