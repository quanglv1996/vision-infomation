"""Nyquist sampling theorem calculator."""
from __future__ import annotations

from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class NyquistCalculator(BaseCalculator):
    """
    Tính tần số Nyquist và kích thước tính năng nhỏ nhất có thể phân giải.

    Nyquist (lp/mm) = 1 / (2 × pixel_size_mm)
    Min feature     = 2 × pixel_size

    Đơn vị vào : pixel_size [µm], required_accuracy [mm] (optional)
    Đơn vị ra  : lp/mm
    Tài liệu   : Basler – Sampling Theorem in Digital Imaging
                 Edmund Optics – Nyquist Frequency and Sampling
    """

    name = "Nyquist Calculator"
    description = "Tính tần số Nyquist, feature size nhỏ nhất có thể phát hiện."
    required_parameters = ["pixel_size"]

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        px_um = params["pixel_size"]          # µm
        px_mm = px_um / 1000.0

        nyquist = 1.0 / (2 * px_mm)
        min_feat_um = 2 * px_um
        min_feat_mm = min_feat_um / 1000.0
        safe_feat_um = 3 * px_um              # 3× safety factor for reliable detection

        details: Dict[str, Any] = {
            "nyquist_frequency_lpmm": round(nyquist, 1),
            "pixel_size_um": px_um,
            "min_detectable_feature_um": round(min_feat_um, 3),
            "min_detectable_feature_mm": round(min_feat_mm, 6),
            "recommended_min_feature_um": round(safe_feat_um, 3),
        }

        req = params.get("required_accuracy")   # mm
        if req:
            can_meet = req >= min_feat_mm
            details["required_accuracy_mm"] = req
            details["can_meet_accuracy"] = can_meet
            details["accuracy_margin_ratio"] = round(req / min_feat_mm, 2)

        return CalculatorResult.success(
            value=round(nyquist, 1),
            unit="lp/mm",
            description="Nyquist Frequency",
            details=details,
        )
