"""Input validation helpers used by services."""
from typing import Optional


def _positive(value: Optional[float], label: str) -> Optional[str]:
    if value is not None and value <= 0:
        return f"{label} phải lớn hơn 0."
    return None


def _range(value: Optional[float], label: str, lo: float, hi: float) -> Optional[str]:
    if value is not None and not (lo <= value <= hi):
        return f"{label} phải trong khoảng {lo}–{hi}."
    return None


def validate_camera(data: dict) -> list[str]:
    checks = [
        _positive(data.get("fps"), "FPS"),
        _positive(data.get("pixel_size"), "Pixel Size"),
        _positive(data.get("resolution_width"), "Resolution Width"),
        _positive(data.get("resolution_height"), "Resolution Height"),
        _positive(data.get("sensor_width"), "Sensor Width"),
        _positive(data.get("sensor_height"), "Sensor Height"),
        _positive(data.get("full_well_capacity"), "Full Well Capacity"),
        _positive(data.get("read_noise"), "Read Noise"),
        _range(data.get("quantum_efficiency"), "Quantum Efficiency", 0, 100),
    ]
    return [e for e in checks if e]


def validate_lens(data: dict) -> list[str]:
    checks = [
        _positive(data.get("focal_length"), "Focal Length"),
        _positive(data.get("aperture"), "Aperture (F-number)"),
        _positive(data.get("image_circle"), "Image Circle"),
        _positive(data.get("min_working_distance"), "Min Working Distance"),
        _positive(data.get("max_working_distance"), "Max Working Distance"),
        _positive(data.get("weight"), "Weight"),
    ]
    return [e for e in checks if e]


def validate_object(data: dict) -> list[str]:
    checks = [
        _positive(data.get("width"), "Width"),
        _positive(data.get("height"), "Height"),
        _positive(data.get("thickness"), "Thickness"),
        _positive(data.get("speed"), "Speed"),
        _positive(data.get("min_defect_size"), "Min Defect Size"),
        _positive(data.get("max_defect_size"), "Max Defect Size"),
        _positive(data.get("required_accuracy"), "Required Accuracy"),
        _positive(data.get("required_repeatability"), "Required Repeatability"),
        _range(data.get("reflectivity"), "Reflectivity", 0, 100),
        _range(data.get("transparency"), "Transparency", 0, 100),
    ]
    return [e for e in checks if e]
