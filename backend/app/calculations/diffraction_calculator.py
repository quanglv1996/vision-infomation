"""Diffraction limit calculator."""
from __future__ import annotations

import math
from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class DiffractionCalculator(BaseCalculator):
    """
    Tính giới hạn nhiễu xạ và đường kính đĩa Airy.

    Airy disk diameter (µm) = 2.44 × λ (µm) × f/#
    Diffraction limit (lp/mm) = 1000 / (λ_µm × f/#)
    Rayleigh criterion (lp/mm) = 1000 / (1.22 × λ_µm × f/#)

    λ mặc định = 550 nm (ánh sáng xanh lá)

    Đơn vị vào : aperture [f/#], pixel_size [µm], wavelength_um [µm] (optional)
    Đơn vị ra  : µm (Airy disk), lp/mm (diffraction limit)
    Tài liệu   : Edmund Optics – Airy Disk and Diffraction
                 Opto Engineering – Resolution Limit
                 Zemax OpticStudio Technical Reference
    """

    name = "Diffraction Calculator"
    description = "Tính đường kính đĩa Airy, giới hạn nhiễu xạ và so sánh với pixel size."
    required_parameters = ["aperture", "pixel_size"]

    _DEFAULT_WAVELENGTH_UM = 0.55  # 550 nm

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        fn  = params["aperture"]
        px  = params["pixel_size"]                                    # µm
        wl  = params.get("wavelength_um", self._DEFAULT_WAVELENGTH_UM)  # µm

        airy_r = 1.22 * wl * fn
        airy_d = 2 * airy_r

        diff_limit = 1000.0 / (wl * fn)
        rayleigh   = 1000.0 / (1.22 * wl * fn)

        ratio = airy_d / px
        is_diff_limited = airy_d >= px

        return CalculatorResult.success(
            value=round(airy_d, 3),
            unit="µm",
            description="Airy Disk Diameter",
            details={
                "airy_disk_diameter_um": round(airy_d, 3),
                "airy_disk_radius_um": round(airy_r, 3),
                "diffraction_limit_lpmm": round(diff_limit, 1),
                "rayleigh_criterion_lpmm": round(rayleigh, 1),
                "pixel_size_um": px,
                "airy_to_pixel_ratio": round(ratio, 3),
                "is_diffraction_limited": is_diff_limited,
                "wavelength_nm": round(wl * 1000, 0),
            },
        )
