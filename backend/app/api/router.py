"""Main API router — aggregates all sub-routers.

To add a module: create ``endpoints/<module>.py`` exposing ``router`` and append it below.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api.endpoints import (
    calculate,
    color_calibration,
    geometric_calibration,
    image_comparison,
    image_quality,
    lighting,
    parameters,
    projects,
    recommendations,
    validation,
)

_MODULES = [
    # Calculator
    calculate,
    parameters,
    projects,
    recommendations,
    # Image-analysis modules
    lighting,
    image_quality,
    geometric_calibration,
    color_calibration,
    validation,
    image_comparison,
]

api_router = APIRouter()
for _module in _MODULES:
    api_router.include_router(_module.router)
