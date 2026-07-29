"""Motion blur calculator."""
from __future__ import annotations

from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class MotionBlurCalculator(BaseCalculator):
    """
    Tính motion blur.

    blur_mm      = speed (mm/s) × exposure_time (s)
    blur_pixels  = blur_mm × pixel_density (px/mm)
    pixel_density = resolution_width / FoV_H (mm)

    Đơn vị vào : object_speed [mm/s], exposure_time [µs], pixel_size [µm],
                 horizontal_fov [mm], resolution_width [px]
    Đơn vị ra  : pixels, mm
    Tài liệu   : Basler Application Note – Avoiding Motion Blur
                 Cognex Vision Guide – Exposure and Motion
    """

    name = "Motion Blur Calculator"
    description = "Tính lượng blur do chuyển động của vật thể trong thời gian phơi sáng."
    required_parameters = ["object_speed", "exposure_time", "pixel_size", "horizontal_fov", "resolution_width"]

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        speed   = params["object_speed"]       # mm/s
        exp_us  = params["exposure_time"]      # µs
        px_um   = params["pixel_size"]         # µm
        h_fov   = params["horizontal_fov"]     # mm
        res_w   = params["resolution_width"]   # px

        exp_s = exp_us / 1_000_000.0
        blur_mm = speed * exp_s

        px_density = res_w / h_fov if h_fov > 0 else 1000.0 / px_um
        blur_px = blur_mm * px_density

        # Max exposure for ≤ 1 pixel blur
        max_exp_1px = (1.0 / px_density / speed * 1_000_000) if speed > 0 else None

        return CalculatorResult.success(
            value=round(blur_px, 3),
            unit="pixels",
            description="Motion Blur",
            details={
                "blur_mm": round(blur_mm, 5),
                "blur_pixels": round(blur_px, 3),
                "pixel_density_px_per_mm": round(px_density, 3),
                "max_exposure_for_1px_blur_us": round(max_exp_1px, 2) if max_exp_1px else None,
                "max_exposure_for_half_px_blur_us": round(max_exp_1px / 2, 2) if max_exp_1px else None,
            },
        )
