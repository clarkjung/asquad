import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException
from anthropic import AsyncAnthropic

from app.config import settings
from app.schemas.a2a import A2ARequest, A2AResponse, A2ATaskResult

router = APIRouter(prefix="/v1/skills", tags=["skills"])

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


@router.post("/{skill_name}/a2a", response_model=A2AResponse)
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
