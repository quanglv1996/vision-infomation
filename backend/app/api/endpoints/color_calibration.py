"""Color Calibration API endpoint."""
from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.api.deps import read_image, service_errors
from app.schemas.color_calibration import ColorCalibrationResult
from app.services.color_calibration_service import run_color_calibration

router = APIRouter(prefix="/color", tags=["color"])

_VALID_TYPES = {"white_card", "gray_card", "colorchecker", "reference"}


@router.post("/analyze", response_model=ColorCalibrationResult)
async def analyze_color(
    image: UploadFile = File(description="Image to analyze (PNG/JPEG/BMP/TIFF)"),
    image_type: str   = Form("reference"),
):
    if image_type not in _VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"image_type must be one of {sorted(_VALID_TYPES)}")

    img = await read_image(image)

    with service_errors("Color analysis error"):
        return run_color_calibration(img, image_type)
