from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    database_url: str = "sqlite:///backend/data/smart_home.db"
    model_path: str = "backend/models/smart_home_model.pkl"

    cors_origins: list[str] = ["http://localhost:8080", "http://127.0.0.1:8080"]
    allowed_hosts: list[str] = ["localhost", "127.0.0.1", "0.0.0.0"]

    rate_limit_requests_per_minute: int = 120

    groq_api_key: str | None = None
    groq_model: str = "llama-3.1-8b-instant"
    groq_timeout_seconds: int = 15


settings = Settings()
