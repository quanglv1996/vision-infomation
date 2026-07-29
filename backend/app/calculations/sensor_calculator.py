"""Sensor performance calculator."""
from __future__ import annotations

import math
from typing import Any, Dict

from app.calculations.base import BaseCalculator, CalculatorResult


class SensorCalculator(BaseCalculator):
    """
    Tính hiệu suất cảm biến.

    Dynamic Range (dB)  = 20 × log10(FWC / read_noise)
    SNR_max (dB)        = 10 × log10(FWC)  [shot-noise limited]
    Photon noise        = √signal
    Total noise         = √(read_noise² + signal)

    Đơn vị vào : full_well_capacity [e-], read_noise [e-],
                 quantum_efficiency [%] (optional), bit_depth (optional)
    Đơn vị ra  : dB
    Tài liệu   : Sony Sensor Technical Notes
                 EMVA1288 Standard for Machine Vision Sensors
                 Princeton Instruments – CCD Sensor Technical Note
    """

    name = "Sensor Calculator"
    description = "Tính dynamic range, SNR và đặc tính nhiễu của cảm biến."
    required_parameters = ["full_well_capacity", "read_noise"]

    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        fwc  = params["full_well_capacity"]    # e-
        rn   = params["read_noise"]            # e-
        qe   = params.get("quantum_efficiency", 70.0)
        bits = params.get("bit_depth", 12)

        dr_db    = 20 * math.log10(fwc / rn)
        dr_stops = dr_db / 6.02
        snr_max  = 10 * math.log10(fwc)

        bits_needed = math.log2(fwc / rn)

        # SNR at half-signal
        half = fwc / 2
        total_noise_half = math.sqrt(rn**2 + half)
        snr_half = 10 * math.log10(half / total_noise_half)

        return CalculatorResult.success(
            value=round(dr_db, 1),
            unit="dB",
            description="Sensor Dynamic Range",
            details={
                "dynamic_range_db": round(dr_db, 1),
                "dynamic_range_stops": round(dr_stops, 1),
                "snr_max_db": round(snr_max, 1),
                "snr_at_half_signal_db": round(snr_half, 1),
                "full_well_capacity_e": fwc,
                "read_noise_e": rn,
                "adc_bits_needed": round(bits_needed, 1),
                "bit_depth": bits,
                "adc_sufficient": bits >= math.ceil(bits_needed),
                "quantum_efficiency_pct": qe,
            },
        )
