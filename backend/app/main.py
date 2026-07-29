"""FastAPI application entry point."""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api import cameras, lenses, objects, pages, vision_setups
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Machine Vision Calculator — quản lý Camera, Lens, Object và tính toán thông số.",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Static files
app.mount("/static", StaticFiles(directory=str(settings.static_dir)), name="static")

# REST API routers
app.include_router(cameras.router)
app.include_router(lenses.router)
app.include_router(objects.router)
app.include_router(vision_setups.router)

# HTML page router (last so /api prefixed routes take priority)
app.include_router(pages.router)


@app.on_event("startup")
async def startup_event() -> None:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Machine Vision Calculator đang chạy tại http://%s:%s", settings.host, settings.port)
