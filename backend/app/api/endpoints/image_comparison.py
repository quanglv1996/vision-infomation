"""Image Comparison API endpoint."""
from __future__ import annotations

import json
from typing import Annotated, Optional

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.image_comparison import ComparisonResult
from app.services.image_comparison_service import run_comparison

router = APIRouter(prefix="/comparison", tags=["comparison"])

DEFAULT_WEIGHTS = {"sharpness": 0.4, "noise": 0.2, "contrast": 0.2, "brightness": 0.1, "entropy": 0.1}


def _decode(data: bytes, name: str) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise HTTPException(status_code=422, detail=f"Cannot decode: {name}")
    return img


@router.post("/analyze", response_model=ComparisonResult)
async def analyze_comparison(
    images: Annotated[list[UploadFile], File(description="2–100 images to compare")],
    names: str = Form(""),
    grayscale: bool = Form(False),
    weights: str = Form(""),
):
    if len(images) < 2:
        raise HTTPException(status_code=400, detail="At least 2 images are required")
    if len(images) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 images")

    decoded: list[np.ndarray] = []
    for f in images:
        data = await f.read()
        img = _decode(data, f.filename or "")
        if grayscale and img.ndim == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        decoded.append(img)

    try:
        custom_names = json.loads(names) if names.strip() else []
    except Exception:
        custom_names = []

    image_names = [
        custom_names[i] if i < len(custom_names) and custom_names[i].strip()
        else (images[i].filename or f"Image {i+1}")
        for i in range(len(images))
    ]

    try:
        w = json.loads(weights) if weights.strip() else DEFAULT_WEIGHTS
    except Exception:
        w = DEFAULT_WEIGHTS

    try:
        return run_comparison(decoded, image_names, w)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Comparison error: {exc}") from exc
