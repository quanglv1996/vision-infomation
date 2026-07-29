"""Field of View calculator."""
from __future__ import annotations

import math
from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class FoVCalculator(BaseCalculator):
    """
    Tính Field of View (FoV).

    Công thức (thin-lens approximation):
        FoV_H (mm) = sensor_width  × working_distance / focal_length
        FoV_V (mm) = sensor_height × working_distance / focal_length

    Đơn vị vào : sensor_width/height [mm], working_distance [mm], focal_length [mm]
    Đơn vị ra  : mm, degrees
    Tài liệu   : Edmund Optics Imaging Resource Guide §3
    """

    name = "Field of View Calculator"
    description = "Tính trường nhìn ngang, dọc và đường chéo của hệ thống."
    required_parameters = ["sensor_width", "sensor_height", "working_distance", "focal_length"]

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        sw = params["sensor_width"]
        sh = params["sensor_height"]
        wd = params["working_distance"]
        fl = params["focal_length"]

        h_fov = sw * wd / fl
        v_fov = sh * wd / fl
        d_fov = math.sqrt(h_fov**2 + v_fov**2)

        h_angle = math.degrees(2 * math.atan(sw / (2 * fl)))
        v_angle = math.degrees(2 * math.atan(sh / (2 * fl)))

        return CalculatorResult.success(
            value=round(h_fov, 3),
            unit="mm",
            description="Horizontal FoV",
            details={
                "horizontal_fov_mm": round(h_fov, 3),
                "vertical_fov_mm": round(v_fov, 3),
                "diagonal_fov_mm": round(d_fov, 3),
                "horizontal_angle_deg": round(h_angle, 2),
                "vertical_angle_deg": round(v_angle, 2),
            },
        )
