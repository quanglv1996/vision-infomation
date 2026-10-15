"""Image Quality Evaluation API endpoint."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.deps import read_images, service_errors
from app.schemas.image_quality import ImageQualityResult
from app.services.image_quality_service import run_quality_analysis

router = APIRouter(prefix="/quality", tags=["quality"])


@router.post("/analyze", response_model=ImageQualityResult)
async def analyze_quality(
    images: Annotated[
        list[UploadFile],
        File(description="One or more images (PNG/BMP/JPEG/TIFF). First image is primary; extras used for temporal noise."),
    ],
):
    if not images:
        raise HTTPException(status_code=400, detail="At least one image is required")

    decoded = await read_images(images)

    with service_errors("Quality analysis error"):
        return run_quality_analysis(decoded)
