import uuid
from app.config import settings


def generate_agent_card(
    agent_id: uuid.UUID,
    name: str,
    description: str,
    skills: list[str],
    protocol_type: str,
) -> dict:
    return {
        "schema_version": "1.0",
        "name": name,
        "description": description,
        "url": f"{settings.gateway_base_url}/api/v1/agents/{agent_id}/a2a",
        "version": "1.0",
        "capabilities": {
            "streaming": True,
            "pushNotifications": False,
            "stateTransitionHistory": False,
        },
        "skills": [
            {"id": skill, "name": skill, "description": f"Capability: {skill}"}
            for skill in skills
        ],
        "defaultInputModes": ["text/plain"],
        "defaultOutputModes": ["text/plain"],
        "supportsA2A": protocol_type == "a2a",
    }
