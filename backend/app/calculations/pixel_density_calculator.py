"""Pixel density calculator."""
from __future__ import annotations

from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class PixelDensityCalculator(BaseCalculator):
    """
    Tính mật độ pixel và kiểm tra khả năng phát hiện lỗi nhỏ nhất.

    pixel_density = resolution_width / FoV_H

    Đơn vị vào : sensor_width [mm], working_distance [mm], focal_length [mm],
                 resolution_width [px], min_defect_size [mm] (optional)
    Đơn vị ra  : pixels/mm
    Tài liệu   : Edmund Optics – Pixel Size & Sampling
    """

    name = "Pixel Density Calculator"
    description = "Tính mật độ pixel và kiểm tra khả năng phân giải lỗi nhỏ nhất."
    required_parameters = ["sensor_width", "working_distance", "focal_length", "resolution_width"]

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        sw  = params["sensor_width"]
        wd  = params["working_distance"]
        fl  = params["focal_length"]
        rw  = params["resolution_width"]
        min_defect = params.get("min_defect_size")   # mm

        h_fov = sw * wd / fl
        density = rw / h_fov
        mpp = h_fov / rw

        details: Dict[str, Any] = {
            "pixels_per_mm": round(density, 3),
            "mm_per_pixel": round(mpp, 6),
            "um_per_pixel": round(mpp * 1000, 3),
        }

        if min_defect:
            px_for_defect = min_defect * density
            can_detect = px_for_defect >= 2.0
            details.update({
                "pixels_per_min_feature": round(px_for_defect, 2),
                "can_detect_min_feature": can_detect,
                "nyquist_margin_ratio": round(px_for_defect / 2.0, 2),
            })

        return CalculatorResult.success(
            value=round(density, 3),
            unit="pixels/mm",
            description="Pixel Density",
            details=details,
        )
