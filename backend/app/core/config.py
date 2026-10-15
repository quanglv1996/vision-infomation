"""Application settings — override any field with an ``MVC_``-prefixed env var.

Example: ``MVC_CORS_ORIGINS='["http://myhost:5173"]'``.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MVC_", env_file=".env", extra="ignore")

    app_name: str = "Machine Vision Calculator"
    version: str = "1.0.0"
    api_prefix: str = "/api"
    log_level: str = "INFO"

    cors_origins: list[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    cors_origin_regex: Optional[str] = r"https://.*\.orivexus\.com"

    catalog_dir: Path = BACKEND_DIR / "catalog"


@lru_cache
def get_settings() -> Settings:
    return Settings()
