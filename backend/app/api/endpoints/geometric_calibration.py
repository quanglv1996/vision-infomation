"""Geometric Camera Calibration API endpoint."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.api.deps import read_images, service_errors
from app.schemas.geometric_calibration import GeometricCalibrationResult
from app.services.geometric_calibration_service import run_geometric_calibration

router = APIRouter(prefix="/calibration", tags=["calibration"])


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

    decoded = await read_images(images)

    # ValueError = not enough usable views / pattern not found → client error
    with service_errors("Calibration failed", client_errors=(ValueError,)):
        return run_geometric_calibration(
            images=decoded,
            pattern_type=pattern_type,
            board_cols=board_cols,
            board_rows=board_rows,
            square_size_mm=square_size_mm,
            sensor_width_mm=sensor_width_mm,
            working_distance_mm=working_distance_mm,
        )
