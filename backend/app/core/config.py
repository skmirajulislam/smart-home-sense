from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_ROOT.parent
ENV_FILE = BACKEND_ROOT / ".env"
DEFAULT_DB_PATH = BACKEND_ROOT / "data" / "smart_home.db"
DEFAULT_MODEL_PATH = BACKEND_ROOT / "models" / "smart_home_model.pkl"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    database_url: str = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"
    model_path: str = str(DEFAULT_MODEL_PATH)

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ]
    cors_origin_regex: str | None = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
    allowed_hosts: list[str] = ["localhost", "127.0.0.1", "0.0.0.0", "testserver"]

    rate_limit_requests_per_minute: int = 120

    groq_api_key: str | None = None
    groq_model: str = "llama-3.1-8b-instant"
    groq_timeout_seconds: int = 15

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        sqlite_relative_prefix = "sqlite:///"
        sqlite_absolute_prefix = "sqlite:////"
        if value.startswith(sqlite_relative_prefix) and not value.startswith(sqlite_absolute_prefix):
            relative_path = value[len(sqlite_relative_prefix) :]
            absolute_path = (PROJECT_ROOT / relative_path).resolve()
            return f"sqlite:///{absolute_path.as_posix()}"
        return value

    @field_validator("model_path")
    @classmethod
    def normalize_model_path(cls, value: str) -> str:
        path = Path(value)
        if path.is_absolute():
            return str(path)
        return str((PROJECT_ROOT / path).resolve())


settings = Settings()
