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
app.include_router(agents.router)
app.include_router(consumers.router)
app.include_router(discovery.router)
app.include_router(gateway.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
