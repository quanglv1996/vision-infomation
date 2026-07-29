"""Depth of Field calculator."""
from __future__ import annotations

import math
from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class DoFCalculator(BaseCalculator):
    """
    Tính Depth of Field (DoF).

    Circle of Confusion c = 2 × pixel_size (µm) → mm
        Near  = d·f² / (f² + N·c·(d − f))
        Far   = d·f² / (f² − N·c·(d − f))
        DoF   = Far − Near
    Hyperfocal H = f² / (N·c) + f

    Đơn vị vào : focal_length [mm], aperture [f/#], working_distance [mm], pixel_size [µm]
    Đơn vị ra  : mm
    Tài liệu   : Basler Technical Guide – DoF in Machine Vision
                 Edmund Optics – Depth of Field and Depth of Focus
    """

    name = "Depth of Field Calculator"
    description = "Tính DoF tổng, điểm gần nhất và xa nhất vẫn còn nét."
    required_parameters = ["focal_length", "aperture", "working_distance", "pixel_size"]

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        f = params["focal_length"]        # mm
        N = params["aperture"]            # f/#
        d = params["working_distance"]    # mm
        px_um = params["pixel_size"]      # µm

        c = px_um * 2 / 1000.0           # CoC in mm

        hyperfocal = f**2 / (N * c) + f

        denom_near = f**2 + N * c * (d - f)
        denom_far  = f**2 - N * c * (d - f)

        near = d * f**2 / denom_near if denom_near != 0 else 0.0

        if denom_far <= 0:
            far = math.inf
            dof = math.inf
        else:
            far = d * f**2 / denom_far
            dof = far - near

        def _fmt(v: float) -> Any:
            return round(v, 3) if v != math.inf else "∞"

        return CalculatorResult.success(
            value=_fmt(dof),
            unit="mm",
            description="Total Depth of Field",
            details={
                "total_dof_mm": _fmt(dof),
                "near_focus_mm": round(near, 3),
                "far_focus_mm": _fmt(far),
                "hyperfocal_distance_mm": round(hyperfocal, 3),
                "circle_of_confusion_mm": round(c, 5),
            },
        )
