"""Image Comparison API endpoint."""
from __future__ import annotations

import json
from typing import Annotated

import cv2
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.api.deps import read_images, service_errors
from app.schemas.image_comparison import ComparisonResult
from app.services.image_comparison_service import run_comparison

router = APIRouter(prefix="/comparison", tags=["comparison"])

DEFAULT_WEIGHTS = {"sharpness": 0.4, "noise": 0.2, "contrast": 0.2, "brightness": 0.1, "entropy": 0.1}
MAX_IMAGES = 100


def _parse_json(raw: str, default):
    try:
        return json.loads(raw) if raw.strip() else default
    except Exception:
        return default


@router.post("/analyze", response_model=ComparisonResult)
async def analyze_comparison(
    images: Annotated[list[UploadFile], File(description="2–100 images to compare")],
    names: str = Form(""),
    grayscale: bool = Form(False),
    weights: str = Form(""),
):
    if len(images) < 2:
        raise HTTPException(status_code=400, detail="At least 2 images are required")
    if len(images) > MAX_IMAGES:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES} images")

    decoded = await read_images(images)
    if grayscale:
        # Keep 3 channels so downstream colour metrics still run
        decoded = [
            cv2.cvtColor(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR) if img.ndim == 3 else img
            for img in decoded
        ]

    custom_names = _parse_json(names, [])
    image_names = [
        custom_names[i] if i < len(custom_names) and custom_names[i].strip()
        else (images[i].filename or f"Image {i+1}")
        for i in range(len(images))
    ]

    with service_errors("Comparison error"):
        return run_comparison(decoded, image_names, _parse_json(weights, DEFAULT_WEIGHTS))
