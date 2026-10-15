"""Lighting calibration API endpoints."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.deps import read_images, read_optional_image, service_errors
from app.schemas.lighting import LightingAnalysisResult
from app.services.lighting_service import run_analysis

router = APIRouter(prefix="/lighting", tags=["lighting"])


@router.post("/analyze", response_model=LightingAnalysisResult)
async def analyze_lighting(
    sequence: Annotated[
        list[UploadFile],
        File(description="Image sequence (10–100 frames, PNG/BMP/JPEG/TIFF)"),
    ],
    white_ref: Annotated[
        Optional[UploadFile],
        File(description="White reference image (optional)"),
    ] = None,
    dark_frame: Annotated[
        Optional[UploadFile],
        File(description="Dark frame image (optional)"),
    ] = None,
):
    if not sequence:
        raise HTTPException(status_code=400, detail="At least one image is required in sequence")

    seq_imgs = await read_images(sequence)
    white_img = await read_optional_image(white_ref)
    dark_img = await read_optional_image(dark_frame)

    with service_errors("Analysis error"):
        return run_analysis(seq_imgs, white_img, dark_img)
