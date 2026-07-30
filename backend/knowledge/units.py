"""Unit conversion utilities for the Machine Vision Calculator."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class UnitConversion:
    from_unit: str
    to_unit: str
    factor: float   # value_to = value_from × factor
    offset: float = 0.0  # value_to = value_from × factor + offset


# All conversions are stored in both directions automatically
_RAW_CONVERSIONS: list[UnitConversion] = [
    # Length
    UnitConversion("mm", "μm", 1_000.0),
    UnitConversion("mm", "m", 0.001),
    UnitConversion("mm", "inch", 1 / 25.4),
    UnitConversion("μm", "nm", 1_000.0),
    UnitConversion("inch", "mm", 25.4),
    UnitConversion("m", "mm", 1_000.0),
    # Time
    UnitConversion("s", "ms", 1_000.0),
    UnitConversion("s", "μs", 1_000_000.0),
    UnitConversion("ms", "μs", 1_000.0),
    UnitConversion("ms", "s", 0.001),
    UnitConversion("μs", "ms", 0.001),
    UnitConversion("μs", "s", 1e-6),
    # Frequency
    UnitConversion("Hz", "kHz", 0.001),
    UnitConversion("kHz", "Hz", 1_000.0),
    # Speed
    UnitConversion("m/s", "mm/s", 1_000.0),
    UnitConversion("mm/s", "m/s", 0.001),
    UnitConversion("m/min", "mm/s", 1_000.0 / 60),
    UnitConversion("mm/s", "m/min", 60 / 1_000.0),
    # Spatial resolution
    UnitConversion("lp/mm", "lp/inch", 25.4),
]


class UnitConverter:
    def __init__(self) -> None:
        self._table: dict[tuple[str, str], UnitConversion] = {}
        for conv in _RAW_CONVERSIONS:
            self._table[(conv.from_unit, conv.to_unit)] = conv
            # auto-register reverse
            if (conv.to_unit, conv.from_unit) not in self._table:
                self._table[(conv.to_unit, conv.from_unit)] = UnitConversion(
                    from_unit=conv.to_unit,
                    to_unit=conv.from_unit,
                    factor=1.0 / conv.factor,
                    offset=-conv.offset / conv.factor,
                )

    def can_convert(self, from_unit: str, to_unit: str) -> bool:
        return from_unit == to_unit or (from_unit, to_unit) in self._table

    def convert(self, value: float, from_unit: str, to_unit: str) -> float:
        if from_unit == to_unit:
            return value
        conv = self._table.get((from_unit, to_unit))
        if conv is None:
            raise ValueError(f"No conversion from '{from_unit}' to '{to_unit}'")
        return value * conv.factor + conv.offset

    def available_conversions(self, unit: str) -> list[str]:
        return [to for (frm, to) in self._table if frm == unit]


# Module-level singleton
converter = UnitConverter()

# Canonical unit for each parameter (used for internal calculations)
CANONICAL_UNITS: dict[str, str] = {
    "resolution_x": "pixel",
    "resolution_y": "pixel",
    "pixel_size": "μm",
    "sensor_width": "mm",
    "sensor_height": "mm",
    "sensor_diagonal": "mm",
    "fps": "fps",
    "bit_depth": "bit",
    "focal_length": "mm",
    "magnification": "",
    "working_distance": "mm",
    "f_number": "",
    "numerical_aperture": "",
    "distortion": "%",
    "image_circle": "mm",
    "object_width": "mm",
    "object_height": "mm",
    "object_thickness": "mm",
    "smallest_feature": "mm",
    "required_accuracy": "mm",
    "speed": "mm/s",
    "exposure_time": "μs",
    "motion_blur": "mm",
    "blur_pixels": "pixel",
    "conveyor_speed": "m/min",
    "encoder_resolution": "pulse/mm",
    "fov_x": "mm",
    "fov_y": "mm",
    "mm_per_pixel": "mm/pixel",
    "pixel_per_mm": "pixel/mm",
    "pixels_per_feature": "pixel",
    "pixels_per_object_x": "pixel",
    "dof": "mm",
    "hyperfocal_distance": "mm",
    "airy_disk": "μm",
    "diffraction_limit": "lp/mm",
    "wavelength": "nm",
    "repeatability": "mm",
    "measurement_error": "mm",
    "detectable_feature": "mm",
}
