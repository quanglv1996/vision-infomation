"""Geometric Camera Calibration API endpoint."""
from __future__ import annotations

from typing import Annotated, Optional

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.geometric_calibration import GeometricCalibrationResult
from app.services.geometric_calibration_service import run_geometric_calibration

router = APIRouter(prefix="/calibration", tags=["calibration"])


def _decode(data: bytes, name: str) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise HTTPException(status_code=422, detail=f"Cannot decode image: {name}")
    return img


@router.post("/geometric", response_model=GeometricCalibrationResult)
async def geometric_calibration(
    images: Annotated[
        list[UploadFile],
        File(description="Calibration images (PNG/BMP/JPEG/TIFF). Minimum 3 images with detected pattern."),
    ],
    pattern_type: str = Form("chessboard"),
    board_cols: int = Form(9),
    board_rows: int = Form(6),
    square_size_mm: float = Form(25.0),
    sensor_width_mm: Optional[float] = Form(None),
    working_distance_mm: Optional[float] = Form(None),
):
    if not images:
        raise HTTPException(status_code=400, detail="At least 3 calibration images are required")

    decoded: list[np.ndarray] = []
    for f in images:
        data = await f.read()
        decoded.append(_decode(data, f.filename or ""))

    try:
        result = run_geometric_calibration(
            images=decoded,
            pattern_type=pattern_type,
            board_cols=board_cols,
            board_rows=board_rows,
            square_size_mm=square_size_mm,
            sensor_width_mm=sensor_width_mm,
            working_distance_mm=working_distance_mm,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Calibration failed: {exc}") from exc

    return result
