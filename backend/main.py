"""Machine Vision Calculator — FastAPI application entry point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.api.router import api_router
from app.core.config import get_settings
from app.core.errors import AppError
from app.db.session import init_db

settings = get_settings()

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger("mvCalc")


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Pre-warm formula engine (SymPy inversions computed once at import time)
    from knowledge.formulas import FORMULAS
    inverses_count = sum(len(f.inverse_expressions) for f in FORMULAS)
    logger.info("Loaded %d formulas with %d auto-derived inverses", len(FORMULAS), inverses_count)
    await run_in_threadpool(init_db)
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


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=headers)


@app.exception_handler(OperationalError)
async def db_unavailable_handler(_: Request, exc: OperationalError) -> JSONResponse:
    logger.error("Database error: %s", exc.orig)
    return JSONResponse(
        status_code=503,
        content={"detail": {"code": "db_unavailable", "message": "Không kết nối được cơ sở dữ liệu. Thử lại sau."}},
    )


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {
        "service": f"{settings.app_name} API",
        "version": settings.version,
        "docs": f"{settings.api_prefix}/docs",
    }
