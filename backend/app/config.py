from pathlib import Path

from pydantic_settings import BaseSettings

# Project root: vision-infomation/
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    app_name: str = "Machine Vision Calculator"
    app_version: str = "1.0.0"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def data_dir(self) -> Path:
        return BASE_DIR / "data"

    @property
    def templates_dir(self) -> Path:
        return BASE_DIR / "frontend" / "templates"

    @property
    def static_dir(self) -> Path:
        return BASE_DIR / "frontend" / "static"


settings = Settings()
