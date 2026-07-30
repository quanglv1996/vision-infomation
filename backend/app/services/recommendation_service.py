"""Camera and lens recommendation service."""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from app.schemas.recommendation import (
    CameraOut,
    LensOut,
    RecommendRequest,
    SystemRecommendationOut,
)
from calculation.engine import engine

_CATALOG_DIR = Path(__file__).parent.parent.parent / "catalog"


def _load_cameras() -> list[dict]:
    with open(_CATALOG_DIR / "cameras.json", encoding="utf-8") as f:
        return json.load(f)


def _load_lenses() -> list[dict]:
    with open(_CATALOG_DIR / "lenses.json", encoding="utf-8") as f:
        return json.load(f)


def _score_system(
    camera: dict, lens: dict, req: RecommendRequest, computed: dict[str, float]
) -> tuple[float, list[str], list[str]]:
    """Return (score, reasons, warnings) for a camera+lens combination."""
    reasons: list[str] = []
    warnings: list[str] = []
    score = 0.0

    mm_per_pix = computed.get("mm_per_pixel")
    fov_x = computed.get("fov_x")
    dof = computed.get("dof")
    pixels_feature = computed.get("pixels_per_feature")
    blur_px = computed.get("blur_pixels")

    # Resolution bonus
    mp = (camera["resolution_x"] * camera["resolution_y"]) / 1e6
    score += min(mp * 5, 30)
    reasons.append(f"{mp:.1f} MP sensor")

    # Scale accuracy
    if mm_per_pix and req.required_accuracy:
        if mm_per_pix <= req.required_accuracy / 3:
            score += 20
            reasons.append(f"mm/pixel ({mm_per_pix:.4f}) satisfies accuracy requirement")
        else:
            warnings.append(f"mm/pixel {mm_per_pix:.4f} may be insufficient for {req.required_accuracy:.4f} mm accuracy")

    # Pixels per feature
    if pixels_feature:
        if pixels_feature >= 6:
            score += 20
            reasons.append(f"{pixels_feature:.1f} px per feature (excellent)")
        elif pixels_feature >= 3:
            score += 10
            reasons.append(f"{pixels_feature:.1f} px per feature (acceptable)")
        else:
            score -= 20
            warnings.append(f"Only {pixels_feature:.1f} px per feature — below Nyquist minimum")

    # Motion blur
    if blur_px is not None:
        if blur_px <= req.max_blur_pixels:
            score += 10
        else:
            warnings.append(f"Expected blur {blur_px:.2f} px > limit {req.max_blur_pixels} px")

    # DOF vs object thickness
    if dof:
        reasons.append(f"DOF = {dof:.2f} mm")

    # Frame rate
    if camera["fps"] >= 60:
        score += 5
        reasons.append(f"{camera['fps']} fps")

    return score, reasons, warnings


def recommend_systems(req: RecommendRequest) -> list[SystemRecommendationOut]:
    cameras = _load_cameras()
    lenses = _load_lenses()

    results: list[SystemRecommendationOut] = []

    for camera in cameras:
        cam_sensor_w = camera["sensor_width"]
        cam_sensor_h = camera["sensor_height"]

        for lens in lenses:
            # Filter: image circle must cover sensor diagonal
            sensor_diag = math.sqrt(cam_sensor_w ** 2 + cam_sensor_h ** 2)
            if lens["image_circle"] < sensor_diag * 0.95:
                continue

            # Build known values for this combination
            known: dict[str, float] = {
                "resolution_x": camera["resolution_x"],
                "resolution_y": camera["resolution_y"],
                "pixel_size": camera["pixel_size"],
                "sensor_width": cam_sensor_w,
                "sensor_height": cam_sensor_h,
                "focal_length": lens["focal_length"],
                "f_number": lens["min_f_number"],
            }
            if req.working_distance:
                known["working_distance"] = req.working_distance
            if req.required_fov_x:
                known["fov_x"] = req.required_fov_x
            if req.smallest_feature:
                known["smallest_feature"] = req.smallest_feature
            if req.speed:
                known["speed"] = req.speed
                known["exposure_time"] = 100.0  # default 100 μs
            if req.required_fov_x:
                known["wavelength"] = 550.0  # default visible light

            result = engine.calculate(known)
            computed = result.all_values

            # Skip if working distance is out of lens range
            wd = computed.get("working_distance", req.working_distance)
            if wd:
                if wd < lens.get("min_working_distance", 0):
                    continue

            score, reasons, warnings = _score_system(camera, lens, req, computed)

            results.append(SystemRecommendationOut(
                camera=CameraOut(**{k: camera[k] for k in CameraOut.model_fields}),
                lens=LensOut(**{k: lens[k] for k in LensOut.model_fields}),
                computed=computed,
                score=score,
                reasons=reasons,
                warnings=warnings,
            ))

    results.sort(key=lambda r: r.score, reverse=True)
    return results[:10]  # top 10
