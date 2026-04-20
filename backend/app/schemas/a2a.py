from pydantic import BaseModel
from typing import Any


class A2ARequest(BaseModel):
    jsonrpc: str = "2.0"
    method: str
    params: dict[str, Any] | None = None
    id: str | int | None = None


class A2ATaskResult(BaseModel):
    id: str
    status: str
    output: Any | None = None
    error: str | None = None


class A2AResponse(BaseModel):
    jsonrpc: str = "2.0"
    result: A2ATaskResult | None = None
    error: dict | None = None
    id: str | int | None = None
