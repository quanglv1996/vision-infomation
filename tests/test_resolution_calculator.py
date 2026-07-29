"""Unit tests for ResolutionCalculator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import pytest
from app.calculations.resolution_calculator import ResolutionCalculator


@pytest.fixture
def calc():
    return ResolutionCalculator()


def test_basic_resolution(calc):
    params = {
        "sensor_width": 11.264,
        "working_distance": 300.0,
        "focal_length": 25.0,
        "resolution_width": 4096,
    }
    result = calc.calculate(params)
    assert result.status == "success"
    assert result.value > 0
    assert result.unit == "mm/pixel"


def test_resolution_decreases_with_zoom(calc):
    """Larger FoV → lower pixel density (larger mm/pixel value)."""
    base = {"sensor_width": 8.0, "focal_length": 25.0, "resolution_width": 1920}
    r_near = calc.calculate({**base, "working_distance": 100})
    r_far  = calc.calculate({**base, "working_distance": 500})
    assert r_far.value > r_near.value


def test_missing_parameters(calc):
    result = calc.calculate({"sensor_width": 11.264})
    assert result.status == "insufficient_data"


def test_um_per_pixel_detail(calc):
    params = {
        "sensor_width": 6.4,
        "working_distance": 200.0,
        "focal_length": 16.0,
        "resolution_width": 1280,
    }
    result = calc.calculate(params)
    assert "um_per_pixel" in result.details
    assert result.details["um_per_pixel"] == pytest.approx(result.value * 1000, rel=1e-6)
