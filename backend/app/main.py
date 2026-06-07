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


@app.post("/admin/seed-v2")
async def seed_v2():
    from app.database import AsyncSessionLocal
    from app.models import Provider, Agent
    import uuid, hashlib

    new_skills = [
        {
            "slug": "legal-contract-reviewer",
            "name": "Legal Contract Reviewer",
            "description": "Expert contract analysis by a senior attorney: identifies risk clauses, missing protections, ambiguous language, and jurisdiction issues. Returns structured risk assessment with recommended revisions.",
            "skills": ["contract-review", "legal-risk", "clause-analysis", "jurisdiction"],
            "category": "Legal",
        },
        {
            "slug": "data-analyst",
            "name": "Data Analyst",
            "description": "Senior BI analyst that turns raw data (CSV, JSON, tables) into executive-level insights. Surfaces key findings, anomalies, and actionable recommendations with suggested visualizations.",
            "skills": ["data-analysis", "business-intelligence", "insights", "sql"],
            "category": "Analytics",
        },
        {
            "slug": "email-writer",
            "name": "B2B Email Writer",
            "description": "Expert B2B copywriter specializing in cold outreach, follow-ups, and sales emails. Short, specific, human emails with clear CTAs. Includes subject line variants and strategic explanation.",
            "skills": ["copywriting", "cold-outreach", "sales-email", "b2b"],
            "category": "Marketing",
        },
    ]

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

        created = 0
        for s in new_skills:
            agent_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"asquad-{s['slug']}-v1")
            existing_agent = await db.get(Agent, agent_id)
            if not existing_agent:
                db.add(Agent(
                    id=agent_id,
                    provider_id=provider_id,
                    name=s["name"],
                    description=s["description"],
                    skills=s["skills"],
                    category=s["category"],
                    protocol_type="a2a",
                    endpoint_url=f"{settings.api_public_url}/v1/skills/{agent_id}/a2a",
                    total_calls=0,
                    avg_latency_ms=1400,
                    success_rate=0.98,
                    status="active",
                ))
                created += 1

        await db.commit()
    return {"created": created, "total": len(new_skills)}

