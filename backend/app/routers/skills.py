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


def _load_skill(skill_name: str) -> str:
    path = SKILLS_DIR / f"{skill_name}.md"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Skill '{skill_name}' not found")
    return path.read_text()


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


@router.post("/v1/skills/{skill_name}/a2a", response_model=A2AResponse)
async def run_skill(skill_name: str, request: A2ARequest):
    system_prompt = _load_skill(skill_name)
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

    output_text = response.content[0].text

    return A2AResponse(
        jsonrpc="2.0",
        id=request.id,
        result=A2ATaskResult(
            id=str(uuid.uuid4()),
            status="completed",
            output=output_text,
        ),
    )


@router.post("/v1/demo/agents/{agent_id}", response_model=A2AResponse)
async def demo_call(agent_id: uuid.UUID, request: A2ARequest, db: AsyncSession = Depends(get_db)):
    """No-auth playground endpoint — looks up the agent's skill and calls it directly."""
    agent = await registry.get_agent(db, agent_id)
    if agent.status != "active":
        raise HTTPException(status_code=503, detail="Agent not active")

    # Extract skill name from endpoint_url (e.g. ".../v1/skills/code_review/a2a" → "code_review")
    url = agent.endpoint_url or ""
    if "/v1/skills/" not in url:
        raise HTTPException(status_code=400, detail="This agent does not support playground demo")

    skill_name = url.split("/v1/skills/")[1].rstrip("/a2a").rstrip("/")
    return await run_skill(skill_name, request)
