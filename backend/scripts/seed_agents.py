"""
Seed demo agents for the asquad marketplace.
Run: docker exec asquad-backend-1 python scripts/seed_agents.py
"""
import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

import sys, os
sys.path.insert(0, "/app")

from app.config import settings
from app.models.provider import Provider
from app.models.agent import Agent
from app.utils.auth import hash_password

SEED_PROVIDER = {
    "email": "demo@asquad.ai",
    "company_name": "asquad Demo",
    "password": "asquad_demo_2026",
}

SEED_AGENTS = [
    {
        "name": "ContractReviewAI",
        "description": "Analyzes legal contracts and highlights risky clauses, missing terms, and compliance issues. Supports NDAs, MSAs, SaaS agreements, and employment contracts.",
        "skills": ["contract-review", "legal-analysis", "risk-detection", "NDA", "compliance"],
        "category": "Legal",
        "endpoint_url": "https://demo.asquad.ai/agents/contract-review/a2a",
        "protocol_type": "a2a",
        "auth_type": "none",
        "total_calls": 14823,
        "avg_latency_ms": 1240,
        "success_rate": 0.987,
    },
    {
        "name": "CodeReviewBot",
        "description": "Reviews pull requests for bugs, security vulnerabilities, and style issues. Supports Python, TypeScript, Go, and Rust. Integrates with GitHub and GitLab.",
        "skills": ["code-review", "security-scan", "bug-detection", "python", "typescript", "go"],
        "category": "Engineering",
        "endpoint_url": "https://demo.asquad.ai/agents/code-review/a2a",
        "protocol_type": "a2a",
        "auth_type": "none",
        "total_calls": 38201,
        "avg_latency_ms": 890,
        "success_rate": 0.994,
    },
    {
        "name": "DataAnalystGPT",
        "description": "Transforms raw CSV or JSON data into insights, charts descriptions, and executive summaries. Ask questions in plain English and get structured analysis back.",
        "skills": ["data-analysis", "csv-parsing", "trend-detection", "summary-generation", "SQL"],
        "category": "Analytics",
        "endpoint_url": "https://demo.asquad.ai/agents/data-analyst/a2a",
        "protocol_type": "a2a",
        "auth_type": "none",
        "total_calls": 9450,
        "avg_latency_ms": 1680,
        "success_rate": 0.978,
    },
    {
        "name": "CustomerSupportAgent",
        "description": "Handles tier-1 customer support tickets with context-aware responses. Escalates complex issues automatically. Learns from your knowledge base.",
        "skills": ["customer-support", "ticket-triage", "escalation", "knowledge-base", "sentiment-analysis"],
        "category": "Customer Success",
        "endpoint_url": "https://demo.asquad.ai/agents/support/a2a",
        "protocol_type": "a2a",
        "auth_type": "none",
        "total_calls": 52340,
        "avg_latency_ms": 620,
        "success_rate": 0.991,
    },
    {
        "name": "SEOContentWriter",
        "description": "Generates SEO-optimized blog posts, meta descriptions, and landing page copy. Conducts keyword research and matches your brand voice.",
        "skills": ["content-writing", "SEO", "keyword-research", "copywriting", "blog-generation"],
        "category": "Marketing",
        "endpoint_url": "https://demo.asquad.ai/agents/seo-writer/a2a",
        "protocol_type": "a2a",
        "auth_type": "none",
        "total_calls": 7892,
        "avg_latency_ms": 2100,
        "success_rate": 0.972,
    },
    {
        "name": "FinancialSummaryBot",
        "description": "Parses earnings reports, 10-K filings, and financial statements into concise summaries with key metrics, risks, and analyst-ready bullet points.",
        "skills": ["financial-analysis", "earnings-summary", "10-K-parsing", "risk-assessment", "metrics-extraction"],
        "category": "Finance",
        "endpoint_url": "https://demo.asquad.ai/agents/financial-summary/a2a",
        "protocol_type": "a2a",
        "auth_type": "none",
        "total_calls": 6130,
        "avg_latency_ms": 1950,
        "success_rate": 0.983,
    },
    {
        "name": "MeetingNotetaker",
        "description": "Transcribes meeting recordings and generates structured notes with action items, decisions, and follow-ups assigned to attendees.",
        "skills": ["transcription", "meeting-notes", "action-items", "summarization", "follow-up"],
        "category": "Productivity",
        "endpoint_url": "https://demo.asquad.ai/agents/notetaker/a2a",
        "protocol_type": "a2a",
        "auth_type": "none",
        "total_calls": 21567,
        "avg_latency_ms": 3200,
        "success_rate": 0.968,
    },
    {
        "name": "ResumeScreener",
        "description": "Scores resumes against job descriptions, flags top candidates, and generates interview question sets. Reduces screening time by 80%.",
        "skills": ["resume-screening", "candidate-scoring", "jd-matching", "interview-questions", "HR"],
        "category": "HR",
        "endpoint_url": "https://demo.asquad.ai/agents/resume-screener/a2a",
        "protocol_type": "a2a",
        "auth_type": "none",
        "total_calls": 4210,
        "avg_latency_ms": 780,
        "success_rate": 0.995,
    },
    {
        "name": "APIDocsGenerator",
        "description": "Generates OpenAPI 3.0 specs and human-readable documentation from code comments, function signatures, or example requests/responses.",
        "skills": ["api-docs", "openapi", "documentation", "swagger", "code-parsing"],
        "category": "Engineering",
        "endpoint_url": "https://demo.asquad.ai/agents/api-docs/a2a",
        "protocol_type": "rest",
        "auth_type": "none",
        "total_calls": 3870,
        "avg_latency_ms": 1100,
        "success_rate": 0.989,
    },
    {
        "name": "TranslationAgent",
        "description": "Translates documents and messages across 50+ languages with domain-aware terminology for legal, medical, and technical content.",
        "skills": ["translation", "localization", "multilingual", "legal-translation", "medical-translation"],
        "category": "Language",
        "endpoint_url": "https://demo.asquad.ai/agents/translation/a2a",
        "protocol_type": "a2a",
        "auth_type": "none",
        "total_calls": 18940,
        "avg_latency_ms": 540,
        "success_rate": 0.996,
    },
]


async def seed():
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Get or create demo provider
        existing = (await db.execute(
            select(Provider).where(Provider.email == SEED_PROVIDER["email"])
        )).scalar_one_or_none()

        if existing:
            provider = existing
            print(f"Using existing demo provider: {provider.id}")
        else:
            provider = Provider(
                email=SEED_PROVIDER["email"],
                company_name=SEED_PROVIDER["company_name"],
                password_hash=hash_password(SEED_PROVIDER["password"]),
            )
            db.add(provider)
            await db.commit()
            await db.refresh(provider)
            print(f"Created demo provider: {provider.id}")

        # Seed agents
        created = 0
        skipped = 0
        for data in SEED_AGENTS:
            existing_agent = (await db.execute(
                select(Agent).where(
                    Agent.provider_id == provider.id,
                    Agent.name == data["name"],
                )
            )).scalar_one_or_none()

            if existing_agent:
                skipped += 1
                continue

            agent_card = {
                "schema_version": "1.0",
                "name": data["name"],
                "description": data["description"],
                "provider": {"organization": SEED_PROVIDER["company_name"]},
                "url": data["endpoint_url"],
                "version": "1.0",
                "protocol": data["protocol_type"],
                "capabilities": {"streaming": data["protocol_type"] == "a2a", "async": False},
                "skills": [{"id": s, "name": s.replace("-", " ").title()} for s in data["skills"]],
            }

            agent = Agent(
                provider_id=provider.id,
                name=data["name"],
                description=data["description"],
                skills=data["skills"],
                category=data["category"],
                endpoint_url=data["endpoint_url"],
                protocol_type=data["protocol_type"],
                auth_type=data["auth_type"],
                auth_credentials=None,
                agent_card=agent_card,
                status="active",
                total_calls=data["total_calls"],
                avg_latency_ms=data["avg_latency_ms"],
                success_rate=data["success_rate"],
            )
            db.add(agent)
            created += 1

        await db.commit()
        print(f"Done. Created {created} agents, skipped {skipped} existing.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
