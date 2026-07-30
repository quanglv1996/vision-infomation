"""Unit tests for individual formulas and inverse derivations."""
import math
import pytest
from knowledge.formulas import FORMULA_BY_ID, FORMULAS, FORMULAS_BY_OUTPUT


class TestForwardFormulas:
    def test_sensor_width(self):
        f = FORMULA_BY_ID["sensor_width_from_resolution"]
        assert abs(f.evaluate({"resolution_x": 2448, "pixel_size": 3.45}) - 2448 * 3.45 / 1000) < 1e-9

    def test_magnification_thin_lens(self):
        f = FORMULA_BY_ID["magnification_from_thin_lens"]
        val = f.evaluate({"focal_length": 50, "working_distance": 550})
        assert abs(val - 50 / (550 - 50)) < 1e-9  # = 50/500 = 0.1

    def test_fov_x(self):
        f = FORMULA_BY_ID["fov_x_from_sensor_mag"]
        val = f.evaluate({"sensor_width": 8.45, "magnification": 0.1})
        assert abs(val - 84.5) < 1e-9

    def test_mm_per_pixel(self):
        f = FORMULA_BY_ID["mm_per_pixel_from_fov_resolution"]
        val = f.evaluate({"fov_x": 84.5, "resolution_x": 2448})
        expected = 84.5 / 2448
        assert abs(val - expected) < 1e-12

    def test_motion_blur(self):
        f = FORMULA_BY_ID["motion_blur_from_speed_exposure"]
        val = f.evaluate({"speed": 200, "exposure_time": 500})
        assert abs(val - 200 * 500 * 1e-6) < 1e-15

    def test_dof(self):
        f = FORMULA_BY_ID["dof_from_aperture"]
        val = f.evaluate({"f_number": 8, "pixel_size": 5.5, "magnification": 0.1})
        expected = 2 * 8 * (5.5 / 1000) * (1 + 0.1) / 0.1**2
        assert abs(val - expected) < 1e-9

    def test_airy_disk(self):
        f = FORMULA_BY_ID["airy_disk_from_fnumber_wavelength"]
        val = f.evaluate({"wavelength": 550, "f_number": 8})
        expected = 2.44 * 8 * 550 / 1000
        assert abs(val - expected) < 1e-9

    def test_diffraction_limit(self):
        f = FORMULA_BY_ID["diffraction_limit_from_wavelength"]
        val = f.evaluate({"wavelength": 550, "f_number": 8})
        expected = 1e6 / (1.22 * 550 * 8)
        assert abs(val - expected) < 1e-6


class TestInverseDerivations:
    def test_sensor_width_inverse_for_resolution_x(self):
        f = FORMULA_BY_ID["sensor_width_from_resolution"]
        assert "resolution_x" in f.inverse_expressions, "SymPy should derive this inverse"
        val = f.evaluate_inverse("resolution_x", {"sensor_width": 8.45, "pixel_size": 3.45})
        assert abs(val - 8.45 * 1000 / 3.45) < 1e-6

    def test_sensor_width_inverse_for_pixel_size(self):
        f = FORMULA_BY_ID["sensor_width_from_resolution"]
        assert "pixel_size" in f.inverse_expressions
        val = f.evaluate_inverse("pixel_size", {"sensor_width": 8.45, "resolution_x": 2448})
        assert abs(val - 8.45 * 1000 / 2448) < 1e-9

    def test_magnification_inverse_for_working_distance(self):
        f = FORMULA_BY_ID["magnification_from_thin_lens"]
        if "working_distance" in f.inverse_expressions:
            val = f.evaluate_inverse(
                "working_distance",
                {"focal_length": 50, "magnification": 0.1},
            )
            assert abs(val - 50 * (1 + 1 / 0.1)) < 1e-6

    def test_fov_x_inverse_for_magnification(self):
        f = FORMULA_BY_ID["fov_x_from_sensor_mag"]
        if "magnification" in f.inverse_expressions:
            val = f.evaluate_inverse("magnification", {"fov_x": 84.5, "sensor_width": 8.45})
            assert abs(val - 8.45 / 84.5) < 1e-9


class TestFormulaCoverage:
    def test_all_formulas_have_correct_parameter_ids(self):
        from knowledge.parameters import PARAMETERS
        for formula in FORMULAS:
            for inp in formula.inputs:
                assert inp in PARAMETERS, f"Formula {formula.id}: unknown input '{inp}'"
            assert formula.output in PARAMETERS, f"Formula {formula.id}: unknown output '{formula.output}'"

    def test_no_duplicate_formula_ids(self):
        ids = [f.id for f in FORMULAS]
        assert len(ids) == len(set(ids)), "Duplicate formula IDs detected"

    def test_all_formulas_evaluate_with_mock_values(self):
        mock = {k: 1.0 for k in ["resolution_x", "resolution_y", "pixel_size",
                                   "sensor_width", "sensor_height", "sensor_diagonal",
                                   "focal_length", "magnification", "working_distance",
                                   "f_number", "fov_x", "fov_y", "mm_per_pixel",
                                   "smallest_feature", "speed", "exposure_time",
                                   "motion_blur", "object_width", "wavelength",
                                   "conveyor_speed", "hyperfocal_distance",
                                   "dof", "airy_disk", "diffraction_limit",
                                   "numerical_aperture", "detectable_feature"]}
        for formula in FORMULAS:
            try:
                val = formula.evaluate(mock)
                assert math.isfinite(val), f"{formula.id} returned non-finite value"
            except Exception as exc:
                pytest.fail(f"Formula {formula.id} raised {exc}")
