"""Spatial resolution calculator."""
from __future__ import annotations

from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class ResolutionCalculator(BaseCalculator):
    """
    Tính độ phân giải không gian.

    mm_per_pixel  = FoV_H / resolution_width
    pixels_per_mm = resolution_width / FoV_H

    Đơn vị vào : sensor_width [mm], working_distance [mm], focal_length [mm],
                 resolution_width [px], resolution_height [px] (optional)
    Đơn vị ra  : mm/pixel, pixel/mm
    Tài liệu   : Basler – Resolution and Pixel Size Basics
                 Edmund Optics – Resolution in Imaging Systems
    """

    name = "Resolution Calculator"
    description = "Tính độ phân giải không gian (mm/pixel và pixel/mm)."
    required_parameters = ["sensor_width", "working_distance", "focal_length", "resolution_width"]

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        sw   = params["sensor_width"]
        wd   = params["working_distance"]
        fl   = params["focal_length"]
        rw   = params["resolution_width"]
        sh   = params.get("sensor_height")
        rh   = params.get("resolution_height")

        h_fov = sw * wd / fl
        mpp_h = h_fov / rw
        ppm_h = rw / h_fov

        details: Dict[str, Any] = {
            "horizontal_fov_mm": round(h_fov, 3),
            "mm_per_pixel": round(mpp_h, 6),
            "pixels_per_mm": round(ppm_h, 3),
            "um_per_pixel": round(mpp_h * 1000, 3),
        }

        if sh and rh:
            v_fov = sh * wd / fl
            mpp_v = v_fov / rh
            details.update({
                "vertical_fov_mm": round(v_fov, 3),
                "mm_per_pixel_vertical": round(mpp_v, 6),
                "pixels_per_mm_vertical": round(rh / v_fov, 3),
            })

        return CalculatorResult.success(
            value=round(mpp_h, 6),
            unit="mm/pixel",
            description="Spatial Resolution (horizontal)",
            details=details,
        )
