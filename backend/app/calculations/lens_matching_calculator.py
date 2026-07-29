"""Lens matching and suitability calculator."""
from __future__ import annotations

import math
from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class LensMatchingCalculator(BaseCalculator):
    """
    Kiểm tra lens có phù hợp với camera và object không.

    Kiểm tra:
      1. Image circle ≥ sensor diagonal
      2. Focal length phù hợp với FoV/WD yêu cầu
      3. MTF50 ≥ Nyquist frequency của sensor

    Đơn vị vào : sensor_width [mm], sensor_height [mm], image_circle [mm],
                 focal_length [mm], working_distance [mm],
                 object_width [mm] (optional), mtf50 [lp/mm] (optional),
                 pixel_size [µm] (optional)
    Đơn vị ra  : score 0–100
    Tài liệu   : Edmund Optics – Lens Selection Guide
                 Opto Engineering – Telecentric Lens Selection
    """

    name = "Lens Matching Calculator"
    description = "Tính điểm tương thích của lens với camera và yêu cầu kiểm tra."
    required_parameters = ["sensor_width", "sensor_height", "image_circle", "focal_length", "working_distance"]

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        sw          = params["sensor_width"]
        sh          = params["sensor_height"]
        ic          = params["image_circle"]
        fl          = params["focal_length"]
        wd          = params["working_distance"]
        obj_w       = params.get("object_width")
        mtf50       = params.get("mtf50")
        px_um       = params.get("pixel_size")

        sensor_diag = math.sqrt(sw**2 + sh**2)
        ic_ok       = ic >= sensor_diag
        ic_margin   = (ic - sensor_diag) / sensor_diag * 100

        # Magnification at working distance
        mag = fl / (wd - fl) if wd > fl else 0.0

        # Required focal length for object_width → full sensor
        req_fl = (sw * wd) / obj_w if obj_w else None

        # MTF vs Nyquist
        nyquist = (1000.0 / (2 * px_um)) if px_um else None
        mtf_ok  = (mtf50 >= nyquist) if (mtf50 and nyquist) else None

        # ── Score ──────────────────────────────────────────────────────
        score = 0
        if ic_ok:
            score += 40
            if ic_margin > 10:
                score += 5
        if mtf_ok is True:
            score += 30
        elif mtf_ok is None:
            score += 15
        if req_fl:
            err = abs(fl - req_fl) / req_fl * 100
            if err < 5:
                score += 25
            elif err < 15:
                score += 15
            elif err < 30:
                score += 5
        else:
            score += 10

        score = min(score, 100)

        return CalculatorResult.success(
            value=score,
            unit="score",
            description="Lens Suitability Score",
            details={
                "lens_suitability_score": score,
                "sensor_diagonal_mm": round(sensor_diag, 3),
                "image_circle_mm": ic,
                "image_circle_ok": ic_ok,
                "image_circle_margin_pct": round(ic_margin, 1),
                "magnification": round(mag, 4),
                "required_focal_length_mm": round(req_fl, 2) if req_fl else None,
                "actual_focal_length_mm": fl,
                "nyquist_lpmm": round(nyquist, 1) if nyquist else None,
                "lens_mtf50_lpmm": mtf50,
                "mtf_sufficient": mtf_ok,
            },
        )
