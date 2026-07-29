"""Unit tests for FoVCalculator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import pytest
from app.calculations.fov_calculator import FoVCalculator


@pytest.fixture
def calc():
    return FoVCalculator()


def test_basic_fov(calc):
    params = {
        "sensor_width": 11.264,
        "sensor_height": 7.048,
        "working_distance": 300.0,
        "focal_length": 25.0,
    }
    result = calc.calculate(params)
    assert result.status == "success"
    assert result.details["horizontal_fov_mm"] == pytest.approx(135.168, rel=1e-3)
    assert result.details["vertical_fov_mm"]   == pytest.approx(84.576,  rel=1e-3)


def test_fov_angles(calc):
    params = {
        "sensor_width": 6.4,
        "sensor_height": 4.8,
        "working_distance": 500.0,
        "focal_length": 12.0,
    }
    result = calc.calculate(params)
    assert result.status == "success"
    assert result.details["horizontal_angle_deg"] > 0
    assert result.details["vertical_angle_deg"] > 0


def test_missing_parameters(calc):
    result = calc.calculate({"sensor_width": 11.264})
    assert result.status == "insufficient_data"
    assert "sensor_height" in result.missing
    assert "working_distance" in result.missing
    assert "focal_length" in result.missing


def test_larger_fov_at_greater_distance(calc):
    base = {"sensor_width": 8.0, "sensor_height": 6.0, "focal_length": 16.0}
    r1 = calc.calculate({**base, "working_distance": 200})
    r2 = calc.calculate({**base, "working_distance": 400})
    assert r2.details["horizontal_fov_mm"] == pytest.approx(2 * r1.details["horizontal_fov_mm"], rel=1e-6)
