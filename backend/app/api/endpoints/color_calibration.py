"""Color Calibration API endpoint."""
from __future__ import annotations

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.color_calibration import ColorCalibrationResult
from app.services.color_calibration_service import run_color_calibration

router = APIRouter(prefix="/color", tags=["color"])

_VALID_TYPES = {"white_card", "gray_card", "colorchecker", "reference"}


def _decode(data: bytes, name: str) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise HTTPException(status_code=422, detail=f"Cannot decode image: {name}")
    return img


@router.post("/analyze", response_model=ColorCalibrationResult)
async def analyze_color(
    image: UploadFile = File(description="Image to analyze (PNG/JPEG/BMP/TIFF)"),
    image_type: str   = Form("reference"),
):
    if image_type not in _VALID_TYPES:
        raise HTTPException(status_code=400, detail=f"image_type must be one of {_VALID_TYPES}")

    data = await image.read()
    img  = _decode(data, image.filename or "")

    try:
        result = run_color_calibration(img, image_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Color analysis error: {exc}") from exc

    return result
