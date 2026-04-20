import time
import uuid
import json
import httpx
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.schemas.a2a import A2ARequest, A2AResponse, A2ATaskResult
from app.services import metering
from app.utils.encryption import decrypt

TIMEOUT_SECONDS = 30.0


async def _get_auth_headers(agent: Agent) -> dict:
    if agent.auth_type == "none":
        return {}
    if not agent.auth_credentials:
        return {}
    creds = decrypt(agent.auth_credentials)
    if agent.auth_type == "api_key":
        return {"X-API-Key": creds}
    if agent.auth_type == "bearer":
        return {"Authorization": f"Bearer {creds}"}
    return {}


async def call_agent(
    db: AsyncSession,
    agent: Agent,
    request: A2ARequest,
    consumer_id: uuid.UUID,
) -> A2AResponse:
    if agent.status != "active":
        raise HTTPException(status_code=503, detail="Agent is not active")

    auth_headers = await _get_auth_headers(agent)
    task_id = str(uuid.uuid4())
    start = time.monotonic()

    try:
        if agent.protocol_type == "a2a":
            result = await _call_a2a_native(agent, request, auth_headers)
        else:
            result = await _call_rest(agent, request, auth_headers, task_id)
    except httpx.TimeoutException:
        latency_ms = int((time.monotonic() - start) * 1000)
        await metering.record_call(
            db, consumer_id, agent.id,
            request_tokens=_estimate_tokens(str(request.params)),
            response_tokens=0,
            latency_ms=latency_ms,
            status="timeout",
        )
        raise HTTPException(status_code=504, detail="Provider agent timed out")
    except httpx.RequestError as e:
        latency_ms = int((time.monotonic() - start) * 1000)
        await metering.record_call(
            db, consumer_id, agent.id,
            request_tokens=_estimate_tokens(str(request.params)),
            response_tokens=0,
            latency_ms=latency_ms,
            status="error",
            error_message=str(e),
        )
        raise HTTPException(status_code=502, detail="Provider agent is unreachable")

    latency_ms = int((time.monotonic() - start) * 1000)
    response_text = str(result.result.output) if result.result else ""
    await metering.record_call(
        db, consumer_id, agent.id,
        request_tokens=_estimate_tokens(str(request.params)),
        response_tokens=_estimate_tokens(response_text),
        latency_ms=latency_ms,
        status="success" if result.error is None else "error",
        error_message=str(result.error) if result.error else None,
    )
    return result


async def _call_a2a_native(
    agent: Agent, request: A2ARequest, auth_headers: dict
) -> A2AResponse:
    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        r = await client.post(
            agent.endpoint_url,
            json=request.model_dump(),
            headers={"Content-Type": "application/json", **auth_headers},
        )
        r.raise_for_status()
        data = r.json()
        return A2AResponse(**data)


async def _call_rest(
    agent: Agent, request: A2ARequest, auth_headers: dict, task_id: str
) -> A2AResponse:
    message = ""
    if request.params:
        messages = request.params.get("message", {})
        if isinstance(messages, dict):
            parts = messages.get("parts", [])
            for part in parts:
                if isinstance(part, dict) and part.get("type") == "text":
                    message = part.get("text", "")
                    break
        elif isinstance(messages, str):
            message = messages

    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        r = await client.post(
            agent.endpoint_url,
            json={"message": message, "context": request.params or {}},
            headers={"Content-Type": "application/json", **auth_headers},
        )
        if r.status_code >= 500:
            raise HTTPException(status_code=502, detail=f"Provider returned {r.status_code}")
        data = r.json()

    output = data.get("output") or data.get("response") or data.get("message") or data
    return A2AResponse(
        id=request.id,
        result=A2ATaskResult(id=task_id, status="completed", output=output),
    )


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)
