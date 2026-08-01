"""Main API router — aggregates all sub-routers."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.endpoints.calculate import router as calculate_router
from app.api.endpoints.color_calibration import router as color_router
from app.api.endpoints.geometric_calibration import router as geocal_router
from app.api.endpoints.image_comparison import router as comparison_router
from app.api.endpoints.image_quality import router as quality_router
from app.api.endpoints.lighting import router as lighting_router
from app.api.endpoints.parameters import router as params_router
from app.api.endpoints.projects import router as projects_router
from app.api.endpoints.recommendations import router as recommend_router
from app.api.endpoints.validation import router as validation_router

api_router = APIRouter()

api_router.include_router(calculate_router)
api_router.include_router(params_router)
api_router.include_router(projects_router)
api_router.include_router(recommend_router)
api_router.include_router(lighting_router)
api_router.include_router(quality_router)
api_router.include_router(geocal_router)
api_router.include_router(color_router)
api_router.include_router(validation_router)
api_router.include_router(comparison_router)
