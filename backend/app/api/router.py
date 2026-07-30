"""Main API router — aggregates all sub-routers."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.endpoints.calculate import router as calculate_router
from app.api.endpoints.parameters import router as params_router
from app.api.endpoints.projects import router as projects_router
from app.api.endpoints.recommendations import router as recommend_router

api_router = APIRouter()

api_router.include_router(calculate_router)
api_router.include_router(params_router)
api_router.include_router(projects_router)
api_router.include_router(recommend_router)
