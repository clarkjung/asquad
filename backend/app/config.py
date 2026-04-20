from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://asquad:asquad@localhost:5432/asquad"
    secret_key: str = "change-me-in-production"
    cors_origins: list[str] = ["http://localhost:3000"]
    openai_api_key: str = ""
    gateway_base_url: str = "http://localhost:8000"

    model_config = {"env_file": ".env"}


settings = Settings()
