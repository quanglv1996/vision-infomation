"""Unit tests for DoFCalculator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import math
import pytest
from app.calculations.dof_calculator import DoFCalculator


@pytest.fixture
def calc():
    return DoFCalculator()


def test_basic_dof(calc):
    params = {
        "focal_length": 25.0,
        "aperture": 5.6,
        "working_distance": 300.0,
        "pixel_size": 5.86,
    }
    result = calc.calculate(params)
    assert result.status == "success"
    assert result.value != "∞"
    assert float(result.value) > 0


def test_dof_increases_with_aperture(calc):
    base = {"focal_length": 25.0, "working_distance": 300.0, "pixel_size": 5.86}
    r_open  = calc.calculate({**base, "aperture": 2.8})
    r_closed = calc.calculate({**base, "aperture": 11.0})
    if r_open.value != "∞" and r_closed.value != "∞":
        assert float(r_closed.value) > float(r_open.value)


def test_missing_parameters(calc):
    result = calc.calculate({"focal_length": 25.0})
    assert result.status == "insufficient_data"


def test_hyperfocal_present(calc):
    params = {
        "focal_length": 16.0,
        "aperture": 4.0,
        "working_distance": 500.0,
        "pixel_size": 3.45,
    }
    result = calc.calculate(params)
    assert "hyperfocal_distance_mm" in result.details
    assert result.details["hyperfocal_distance_mm"] > 0
