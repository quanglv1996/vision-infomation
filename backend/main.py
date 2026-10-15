"""Machine Vision Calculator — FastAPI application entry point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings

settings = get_settings()

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger("mvCalc")


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Pre-warm formula engine (SymPy inversions computed once at import time)
    from knowledge.formulas import FORMULAS
    inverses_count = sum(len(f.inverse_expressions) for f in FORMULAS)
    logger.info("Loaded %d formulas with %d auto-derived inverses", len(FORMULAS), inverses_count)
    yield


app = FastAPI(
    title=settings.app_name,
    description=(
        "Engineering Knowledge System for Machine Vision.\n\n"
        "Enter any known parameters — the engine automatically infers everything derivable."
    ),
    version=settings.version,
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
    openapi_url=f"{settings.api_prefix}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {
        "service": f"{settings.app_name} API",
        "version": settings.version,
        "docs": f"{settings.api_prefix}/docs",
    }
