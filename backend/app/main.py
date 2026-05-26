from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import providers, agents, consumers, discovery, gateway

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


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/admin/seed")
async def seed_agents():
    from app.database import AsyncSessionLocal
    from app.models import Provider, Agent
    import uuid, hashlib

    demo_agents = [
        {"name": "LegalEagle AI", "description": "Contract review, clause extraction, and legal risk analysis for enterprises.", "skills": ["contract-review", "risk-analysis", "clause-extraction"], "category": "Legal", "protocol_type": "a2a", "total_calls": 14823, "avg_latency_ms": 420, "success_rate": 0.97},
        {"name": "CodeSense", "description": "Automated code review, bug detection, and refactoring suggestions for engineering teams.", "skills": ["code-review", "bug-detection", "refactoring"], "category": "Engineering", "protocol_type": "a2a", "total_calls": 32100, "avg_latency_ms": 310, "success_rate": 0.98},
        {"name": "DataPulse", "description": "Business intelligence agent that queries databases and generates natural-language insights.", "skills": ["sql-query", "data-analysis", "report-generation"], "category": "Analytics", "protocol_type": "rest", "total_calls": 8900, "avg_latency_ms": 540, "success_rate": 0.95},
        {"name": "SupportMind", "description": "AI-powered customer support agent that handles tickets, escalations, and knowledge base queries.", "skills": ["ticket-routing", "sentiment-analysis", "knowledge-base"], "category": "Customer Success", "protocol_type": "a2a", "total_calls": 22400, "avg_latency_ms": 280, "success_rate": 0.96},
        {"name": "CopyFlow", "description": "Marketing copy generation: ads, emails, landing pages, and social media content at scale.", "skills": ["copywriting", "email-generation", "ad-copy"], "category": "Marketing", "protocol_type": "rest", "total_calls": 18700, "avg_latency_ms": 390, "success_rate": 0.94},
        {"name": "FinanceBot", "description": "Automates financial reporting, expense categorization, and budget forecasting.", "skills": ["expense-categorization", "budget-forecasting", "financial-reporting"], "category": "Finance", "protocol_type": "a2a", "total_calls": 9600, "avg_latency_ms": 460, "success_rate": 0.97},
        {"name": "TaskFlow AI", "description": "Intelligent task management agent that prioritizes work and syncs with project tools.", "skills": ["task-prioritization", "calendar-sync", "project-management"], "category": "Productivity", "protocol_type": "rest", "total_calls": 11200, "avg_latency_ms": 210, "success_rate": 0.99},
        {"name": "TalentScout", "description": "Screens resumes, matches candidates to job descriptions, and schedules interviews automatically.", "skills": ["resume-screening", "candidate-matching", "interview-scheduling"], "category": "HR", "protocol_type": "a2a", "total_calls": 7300, "avg_latency_ms": 500, "success_rate": 0.93},
        {"name": "Polyglot", "description": "Real-time translation and localization agent supporting 80+ languages with cultural context.", "skills": ["translation", "localization", "language-detection"], "category": "Language", "protocol_type": "a2a", "total_calls": 41500, "avg_latency_ms": 190, "success_rate": 0.99},
        {"name": "InsightCRM", "description": "Analyzes CRM data to surface churn risks, upsell opportunities, and pipeline forecasts.", "skills": ["churn-prediction", "upsell-analysis", "pipeline-forecast"], "category": "Analytics", "protocol_type": "rest", "total_calls": 6100, "avg_latency_ms": 620, "success_rate": 0.95},
    ]

    async with AsyncSessionLocal() as db:
        # Create demo provider
        provider_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, "demo@asquad.ai"))
        existing = await db.get(Provider, provider_id)
        if not existing:
            provider = Provider(
                id=provider_id,
                email="demo@asquad.ai",
                company_name="asquad.ai Demo",
                hashed_password=hashlib.sha256(b"demo").hexdigest(),
            )
            db.add(provider)

        # Create agents
        created = 0
        for a in demo_agents:
            agent_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, a["name"]))
            existing_agent = await db.get(Agent, agent_id)
            if not existing_agent:
                db.add(Agent(
                    id=agent_id,
                    provider_id=provider_id,
                    name=a["name"],
                    description=a["description"],
                    skills=a["skills"],
                    category=a["category"],
                    protocol_type=a["protocol_type"],
                    endpoint_url=f"https://demo.asquad.ai/agents/{agent_id}",
                    total_calls=a["total_calls"],
                    avg_latency_ms=a["avg_latency_ms"],
                    success_rate=a["success_rate"],
                    status="active",
                ))
                created += 1

        await db.commit()
    return {"seeded": created, "total": len(demo_agents)}
