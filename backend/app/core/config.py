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
    version: str = "1.2.0"
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

    # ── Database ────────────────────────────────────────────────────────────
    database_url: str = "postgresql+psycopg://vision:vision@localhost:5432/vision"

    # ── Auth ────────────────────────────────────────────────────────────────
    # Empty → a random key per process (dev only: tokens die on every restart).
    secret_key: str = ""
    access_token_minutes: int = 60 * 24 * 7
    verify_token_hours: int = 48
    reset_token_minutes: int = 60
    # Created on startup when no user with this email exists.
    admin_email: str = ""
    admin_password: str = ""
    admin_name: str = "Administrator"
    max_configs_per_user: int = 500

    # ── Email ───────────────────────────────────────────────────────────────
    # Links in emails point here (?verify=… / ?reset=…).
    frontend_url: str = "http://localhost:5173"
    # Empty host → emails are written to the log instead of being sent.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "Vision Studio <no-reply@vision.local>"
    smtp_starttls: bool = False
    smtp_ssl: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
