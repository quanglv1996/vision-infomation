"""Lighting calibration API endpoints."""
from __future__ import annotations

from typing import Annotated, Optional

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.lighting import LightingAnalysisResult
from app.services.lighting_service import run_analysis

router = APIRouter(prefix="/lighting", tags=["lighting"])

_SUPPORTED = {".png", ".bmp", ".jpg", ".jpeg", ".tif", ".tiff"}


def _decode(data: bytes, filename: str) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise HTTPException(status_code=422, detail=f"Cannot decode image: {filename}")
    return img


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

    seq_imgs: list[np.ndarray] = []
    for f in sequence:
        data = await f.read()
        seq_imgs.append(_decode(data, f.filename or ""))

    white_img: Optional[np.ndarray] = None
    if white_ref:
        data = await white_ref.read()
        white_img = _decode(data, white_ref.filename or "")

    dark_img: Optional[np.ndarray] = None
    if dark_frame:
        data = await dark_frame.read()
        dark_img = _decode(data, dark_frame.filename or "")

    try:
        result = run_analysis(seq_imgs, white_img, dark_img)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Analysis error: {exc}") from exc

    return result
