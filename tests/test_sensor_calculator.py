"""Unit tests for SensorCalculator."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

import math
import pytest
from app.calculations.sensor_calculator import SensorCalculator


@pytest.fixture
def calc():
    return SensorCalculator()


def test_dynamic_range(calc):
    # DR = 20 * log10(10000 / 5) = 20 * log10(2000) ≈ 66.02 dB
    params = {"full_well_capacity": 10000.0, "read_noise": 5.0}
    result = calc.calculate(params)
    assert result.status == "success"
    assert result.value == pytest.approx(20 * math.log10(2000), rel=1e-3)


def test_high_fwc_high_dr(calc):
    r_low  = calc.calculate({"full_well_capacity": 5000,  "read_noise": 10.0})
    r_high = calc.calculate({"full_well_capacity": 50000, "read_noise": 10.0})
    assert r_high.value > r_low.value


def test_missing_parameters(calc):
    result = calc.calculate({"full_well_capacity": 10000.0})
    assert result.status == "insufficient_data"
    assert "read_noise" in result.missing


def test_adc_sufficient(calc):
    params = {
        "full_well_capacity": 15000.0,
        "read_noise": 3.0,
        "bit_depth": 12,
    }
    result = calc.calculate(params)
    bits_needed = result.details["adc_bits_needed"]
    assert result.details["adc_sufficient"] == (12 >= math.ceil(bits_needed))


def test_diffraction_calculator():
    from app.calculations.diffraction_calculator import DiffractionCalculator
    calc = DiffractionCalculator()
    result = calc.calculate({"aperture": 5.6, "pixel_size": 5.86})
    assert result.status == "success"
    # Airy disk = 2.44 * 0.55 * 5.6 = 7.52 µm approx
    assert result.value == pytest.approx(2.44 * 0.55 * 5.6, rel=1e-3)


def test_nyquist_calculator():
    from app.calculations.nyquist_calculator import NyquistCalculator
    calc = NyquistCalculator()
    result = calc.calculate({"pixel_size": 5.0})
    assert result.status == "success"
    # Nyquist = 1 / (2 * 0.005 mm) = 100 lp/mm
    assert result.value == pytest.approx(100.0, rel=1e-6)
