"""Unit tests for the calculation engine."""
import pytest
from calculation.engine import CalculationEngine


@pytest.fixture
def eng():
    return CalculationEngine()


class TestForwardChaining:
    def test_sensor_width_from_resolution(self, eng):
        result = eng.calculate({"resolution_x": 2448, "pixel_size": 3.45})
        assert abs(result.all_values["sensor_width"] - 2448 * 3.45 / 1000) < 1e-9

    def test_full_chain_from_camera_and_lens(self, eng):
        known = {
            "resolution_x": 2448,
            "resolution_y": 2048,
            "pixel_size": 3.45,
            "focal_length": 50,
            "working_distance": 500,
        }
        result = eng.calculate(known)
        v = result.all_values
        assert "sensor_width" in v
        assert "magnification" in v
        assert "fov_x" in v
        assert "mm_per_pixel" in v
        assert "detectable_feature" in v

    def test_mm_per_pixel_consistency(self, eng):
        """Both paths to mm_per_pixel should agree."""
        known = {
            "resolution_x": 2448,
            "pixel_size": 3.45,
            "focal_length": 50,
            "working_distance": 500,
        }
        result = eng.calculate(known)
        v = result.all_values

        via_fov = v.get("fov_x", 0) / known["resolution_x"]
        via_pixel_mag = (known["pixel_size"] / 1000) / v.get("magnification", 1)
        assert abs(via_fov - via_pixel_mag) < 1e-9

    def test_motion_blur_chain(self, eng):
        known = {
            "speed": 200,         # mm/s
            "exposure_time": 500, # μs
            "mm_per_pixel": 0.05,
        }
        result = eng.calculate(known)
        v = result.all_values
        assert abs(v["motion_blur"] - 200 * 500 * 1e-6) < 1e-12
        assert abs(v["blur_pixels"] - v["motion_blur"] / 0.05) < 1e-9


class TestInverseChaining:
    def test_sensor_width_inverse_gives_pixel_size(self, eng):
        # Give sensor_width and resolution_x → engine should find pixel_size
        result = eng.calculate({"sensor_width": 8.45, "resolution_x": 2448})
        v = result.all_values
        expected_pixel_size = 8.45 * 1000 / 2448
        assert abs(v["pixel_size"] - expected_pixel_size) < 1e-6

    def test_working_distance_inverse(self, eng):
        # Give focal_length and magnification → should compute working_distance
        result = eng.calculate({"focal_length": 50, "magnification": 0.1})
        wd = result.all_values.get("working_distance")
        assert wd is not None
        assert abs(wd - 50 * (1 + 1 / 0.1)) < 1e-6


class TestMissingAnalysis:
    def test_missing_for_target(self, eng):
        result = eng.calculate({"resolution_x": 2448}, targets=["mm_per_pixel"])
        missing = result.missing_for_targets.get("mm_per_pixel", [])
        # mm_per_pixel needs fov_x or (pixel_size + magnification)
        assert len(missing) > 0

    def test_no_missing_when_fully_specified(self, eng):
        known = {
            "resolution_x": 2448,
            "resolution_y": 2048,
            "pixel_size": 3.45,
            "focal_length": 50,
            "working_distance": 500,
        }
        result = eng.calculate(known, targets=["mm_per_pixel"])
        missing = result.missing_for_targets.get("mm_per_pixel", [])
        assert missing == []


class TestWarnings:
    def test_blur_warning(self, eng):
        known = {
            "speed": 1000,
            "exposure_time": 5000,
            "mm_per_pixel": 0.05,
        }
        result = eng.calculate(known)
        blur_warnings = [w for w in result.warnings if w.parameter_id == "blur_pixels"]
        assert len(blur_warnings) > 0

    def test_nyquist_warning(self, eng):
        known = {
            "smallest_feature": 0.05,
            "mm_per_pixel": 0.04,  # only 1.25 px per feature
        }
        result = eng.calculate(known)
        nyquist_warnings = [w for w in result.warnings if "Nyquist" in w.message or "pixel" in w.message.lower()]
        assert len(nyquist_warnings) > 0
