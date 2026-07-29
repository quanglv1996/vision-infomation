"""Brightness / illumination calculator."""
from __future__ import annotations

import math
from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class BrightnessCalculator(BaseCalculator):
    """
    Ước tính mức sáng tương đối trên cảm biến.

    Relative brightness = 1 / f²  (chuẩn hoá về f/1.0 = 100 %)
    Stops from f/1      = 2 × log2(f/#)

    Đơn vị vào : aperture [f/#], exposure_time [µs],
                 reflectivity [%] (optional), ambient_light [lux] (optional)
    Đơn vị ra  : % (relative brightness)
    Tài liệu   : Basler Application Note – Illumination in Machine Vision
                 Keyence Machine Vision Lighting Guide
    """

    name = "Brightness Calculator"
    description = "Ước tính mức sáng tương đối và ảnh hưởng của f-number."
    required_parameters = ["aperture", "exposure_time"]

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        fn   = params["aperture"]
        ex   = params["exposure_time"]     # µs
        refl = params.get("reflectivity", 50.0)
        amb  = params.get("ambient_light", 0.0)

        ex_s = ex / 1_000_000.0
        rel_brightness = 100.0 / fn**2
        stops = 2 * math.log2(fn)
        snr_rel = -10 * math.log10(fn**2)

        return CalculatorResult.success(
            value=round(rel_brightness, 2),
            unit="%",
            description="Relative Brightness (% of f/1.0)",
            details={
                "relative_brightness_pct": round(rel_brightness, 2),
                "f_number": fn,
                "stops_from_f1": round(stops, 1),
                "exposure_time_us": ex,
                "exposure_time_s": ex_s,
                "reflectivity_pct": refl,
                "ambient_light_lux": amb,
                "snr_impact_db_relative": round(snr_rel, 1),
            },
        )
