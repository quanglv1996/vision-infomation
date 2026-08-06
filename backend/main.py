"""Machine Vision Calculator — FastAPI application entry point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mvCalc")


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Pre-warm formula engine (SymPy inversions computed once at import time)
    from knowledge.formulas import FORMULAS
    inverses_count = sum(len(f.inverse_expressions) for f in FORMULAS)
    logger.info("Loaded %d formulas with %d auto-derived inverses", len(FORMULAS), inverses_count)
    yield


app = FastAPI(
    title="Machine Vision Calculator",
    description=(
        "Engineering Knowledge System for Machine Vision.\n\n"
        "Enter any known parameters — the engine automatically infers everything derivable."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.orivexus\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {
        "service": "Machine Vision Calculator API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }
