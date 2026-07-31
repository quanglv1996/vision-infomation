"""Image Quality Evaluation API endpoint."""
from __future__ import annotations

from typing import Annotated

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.image_quality import ImageQualityResult
from app.services.image_quality_service import run_quality_analysis

router = APIRouter(prefix="/quality", tags=["quality"])


def _decode(data: bytes, name: str) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise HTTPException(status_code=422, detail=f"Cannot decode image: {name}")
    return img


@router.post("/analyze", response_model=ImageQualityResult)
async def analyze_quality(
    images: Annotated[
        list[UploadFile],
        File(description="One or more images (PNG/BMP/JPEG/TIFF). First image is primary; extras used for temporal noise."),
    ],
):
    if not images:
        raise HTTPException(status_code=400, detail="At least one image is required")

    decoded: list[np.ndarray] = []
    for f in images:
        data = await f.read()
        decoded.append(_decode(data, f.filename or ""))

    try:
        result = run_quality_analysis(decoded)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Quality analysis error: {exc}") from exc

    return result
