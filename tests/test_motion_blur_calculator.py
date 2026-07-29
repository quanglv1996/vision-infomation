"""Unit tests for MotionBlurCalculator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import pytest
from app.calculations.motion_blur_calculator import MotionBlurCalculator


@pytest.fixture
def calc():
    return MotionBlurCalculator()


def test_zero_speed(calc):
    params = {
        "object_speed": 0.001,
        "exposure_time": 100.0,
        "pixel_size": 5.86,
        "horizontal_fov": 135.0,
        "resolution_width": 1920,
    }
    result = calc.calculate(params)
    assert result.status == "success"
    assert result.value < 0.01  # nearly zero blur


def test_blur_proportional_to_speed(calc):
    base = {
        "exposure_time": 100.0,
        "pixel_size": 5.86,
        "horizontal_fov": 135.0,
        "resolution_width": 1920,
    }
    r1 = calc.calculate({**base, "object_speed": 100.0})
    r2 = calc.calculate({**base, "object_speed": 200.0})
    assert r2.value == pytest.approx(r1.value * 2, rel=1e-6)


def test_missing_parameters(calc):
    result = calc.calculate({"object_speed": 100.0})
    assert result.status == "insufficient_data"


def test_max_exposure_recommendation(calc):
    params = {
        "object_speed": 500.0,
        "exposure_time": 50.0,
        "pixel_size": 5.86,
        "horizontal_fov": 100.0,
        "resolution_width": 2448,
    }
    result = calc.calculate(params)
    assert "max_exposure_for_1px_blur_us" in result.details
    assert result.details["max_exposure_for_1px_blur_us"] > 0
