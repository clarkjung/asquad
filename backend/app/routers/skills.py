import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from anthropic import AsyncAnthropic

from app.config import settings
from app.database import get_db
from app.services import registry
from app.schemas.a2a import A2ARequest, A2AResponse, A2ATaskResult

router = APIRouter(tags=["skills"])

SKILLS_DIR = Path(__file__).parent.parent / "skills"


def _extract_message(request: A2ARequest) -> str:
    if not request.params:
        return ""
    message = request.params.get("message", {})
    if isinstance(message, dict):
        for part in message.get("parts", []):
            if isinstance(part, dict) and part.get("text"):
                return part["text"]
    if isinstance(message, str):
        return message
    return ""


async def _run_with_prompt(system_prompt: str, request: A2ARequest) -> A2AResponse:
    user_message = _extract_message(request)
    if not user_message:
        raise HTTPException(status_code=400, detail="No message provided")

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    return A2AResponse(
        jsonrpc="2.0",
        id=request.id,
        result=A2ATaskResult(
            id=str(uuid.uuid4()),
            status="completed",
            output=response.content[0].text,
        ),
    )


@router.post("/v1/skills/{agent_id}/a2a", response_model=A2AResponse)
async def run_skill(agent_id: uuid.UUID, request: A2ARequest, db: AsyncSession = Depends(get_db)):
    agent = await registry.get_agent(db, agent_id)

    # Use DB skill_prompt if available, else fall back to legacy .md file
    if agent.skill_prompt:
        system_prompt = agent.skill_prompt
    else:
        md_file = SKILLS_DIR / f"{agent_id}.md"
        # Legacy fallback: try matching by name slug
        slug = agent.name.lower().replace(" ", "_")
        legacy_file = SKILLS_DIR / f"{slug}.md"
        if legacy_file.exists():
            system_prompt = legacy_file.read_text()
        elif md_file.exists():
            system_prompt = md_file.read_text()
        else:
            raise HTTPException(status_code=404, detail="Skill prompt not found for this agent")

    return await _run_with_prompt(system_prompt, request)


@router.post("/v1/demo/agents/{agent_id}", response_model=A2AResponse)
async def demo_call(agent_id: uuid.UUID, request: A2ARequest, db: AsyncSession = Depends(get_db)):
    """No-auth playground endpoint."""
    agent = await registry.get_agent(db, agent_id)
    if agent.status != "active":
        raise HTTPException(status_code=503, detail="Agent not active")
    return await run_skill(agent_id, request, db)
