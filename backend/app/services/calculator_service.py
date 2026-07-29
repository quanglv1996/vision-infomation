"""Calculator service — orchestrates all Machine Vision calculators."""
from __future__ import annotations

import logging
from typing import Any, Dict

from app.calculations.brightness_calculator import BrightnessCalculator
from app.calculations.diffraction_calculator import DiffractionCalculator
from app.calculations.dof_calculator import DoFCalculator
from app.calculations.fov_calculator import FoVCalculator
from app.calculations.lens_matching_calculator import LensMatchingCalculator
from app.calculations.motion_blur_calculator import MotionBlurCalculator
from app.calculations.nyquist_calculator import NyquistCalculator
from app.calculations.pixel_density_calculator import PixelDensityCalculator
from app.calculations.resolution_calculator import ResolutionCalculator
from app.calculations.sensor_calculator import SensorCalculator

logger = logging.getLogger(__name__)


class CalculatorService:
    """Chạy tất cả calculator và trả về kết quả tổng hợp."""

    def __init__(self) -> None:
        self._calcs = {
            "fov":           FoVCalculator(),
            "dof":           DoFCalculator(),
            "motion_blur":   MotionBlurCalculator(),
            "resolution":    ResolutionCalculator(),
            "pixel_density": PixelDensityCalculator(),
            "diffraction":   DiffractionCalculator(),
            "nyquist":       NyquistCalculator(),
            "brightness":    BrightnessCalculator(),
            "lens_matching": LensMatchingCalculator(),
            "sensor":        SensorCalculator(),
        }

    # ── Public ───────────────────────────────────────────────────────────

    def run_all(
        self,
        camera: Dict[str, Any],
        lens: Dict[str, Any],
        obj: Dict[str, Any],
        setup: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Chạy tất cả calculator, trả về dict kết quả."""
        params = self._build_params(camera, lens, obj, setup)
        results: Dict[str, Any] = {}

        # FoV first — other calcs may need it
        fov_res = self._calcs["fov"].calculate(params)
        results["fov"] = fov_res.to_dict()
        if fov_res.status == "success":
            params["horizontal_fov"] = fov_res.details.get("horizontal_fov_mm")
            params["vertical_fov"]   = fov_res.details.get("vertical_fov_mm")

        for key, calc in self._calcs.items():
            if key == "fov":
                continue
            try:
                results[key] = calc.calculate(params).to_dict()
            except Exception as exc:  # noqa: BLE001
                logger.error("Calculator '%s' gặp lỗi: %s", key, exc)
                results[key] = {"status": "error", "description": str(exc)}

        results["scores"] = self._compute_scores(results, params)
        return results

    # ── Private ──────────────────────────────────────────────────────────

    @staticmethod
    def _build_params(
        camera: Dict[str, Any],
        lens: Dict[str, Any],
        obj: Dict[str, Any],
        setup: Dict[str, Any],
    ) -> Dict[str, Any]:
        p: Dict[str, Any] = {}

        # Camera
        p.update({
            "resolution_width":    camera.get("resolution_width"),
            "resolution_height":   camera.get("resolution_height"),
            "pixel_size":          camera.get("pixel_size"),
            "sensor_width":        camera.get("sensor_width"),
            "sensor_height":       camera.get("sensor_height"),
            "fps":                 camera.get("fps"),
            "exposure_time":       camera.get("exposure_time_min"),
            "dynamic_range":       camera.get("dynamic_range"),
            "full_well_capacity":  camera.get("full_well_capacity"),
            "read_noise":          camera.get("read_noise"),
            "quantum_efficiency":  camera.get("quantum_efficiency"),
            "bit_depth":           camera.get("bit_depth"),
        })

        # Lens
        p.update({
            "focal_length":  lens.get("focal_length"),
            "aperture":      lens.get("aperture"),
            "image_circle":  lens.get("image_circle"),
            "distortion":    lens.get("distortion"),
            "mtf10":         lens.get("mtf10"),
            "mtf30":         lens.get("mtf30"),
            "mtf50":         lens.get("mtf50"),
            "is_telecentric": lens.get("is_telecentric"),
        })

        # Object
        p.update({
            "object_width":          obj.get("width"),
            "object_height":         obj.get("height"),
            "object_speed":          obj.get("speed"),
            "min_defect_size":       obj.get("min_defect_size"),
            "max_defect_size":       obj.get("max_defect_size"),
            "required_accuracy":     obj.get("required_accuracy"),
            "required_repeatability": obj.get("required_repeatability"),
            "reflectivity":          obj.get("reflectivity"),
        })

        # Setup
        p.update({
            "working_distance": setup.get("working_distance"),
            "lighting_angle":   setup.get("lighting_angle"),
            "ambient_light":    setup.get("ambient_light"),
            "camera_tilt":      setup.get("camera_tilt"),
        })

        return p

    @staticmethod
    def _compute_scores(
        results: Dict[str, Any],
        params: Dict[str, Any],
    ) -> Dict[str, Any]:
        # Lens score
        lm = results.get("lens_matching", {})
        lens_score = lm.get("value", 50) if lm.get("status") == "success" else 50

        # Camera score
        cam_score = 0
        px_um = params.get("pixel_size")
        min_def = params.get("min_defect_size")
        if px_um and min_def:
            px_mm = px_um / 1000.0
            ratio = min_def / px_mm
            if ratio >= 3:
                cam_score += 40
            elif ratio >= 2:
                cam_score += 25
            elif ratio >= 1:
                cam_score += 10
        else:
            cam_score += 20

        sensor_res = results.get("sensor", {})
        if sensor_res.get("status") == "success":
            dr = sensor_res.get("details", {}).get("dynamic_range_db", 0)
            if dr >= 60:
                cam_score += 35
            elif dr >= 50:
                cam_score += 25
            elif dr >= 40:
                cam_score += 15
            else:
                cam_score += 5
        else:
            cam_score += 15

        adc_ok = sensor_res.get("details", {}).get("adc_sufficient")
        if adc_ok is True:
            cam_score += 25
        elif adc_ok is None:
            cam_score += 10

        cam_score = min(cam_score, 100)

        # Motion blur penalty
        mb = results.get("motion_blur", {})
        motion_penalty = 0
        if mb.get("status") == "success":
            blur_px = mb.get("value", 0)
            if blur_px > 2:
                motion_penalty = 20
            elif blur_px > 1:
                motion_penalty = 10

        overall = (lens_score * 0.5 + cam_score * 0.5) - motion_penalty

        return {
            "lens_suitability":   round(float(lens_score), 1),
            "camera_suitability": round(float(cam_score), 1),
            "overall":            round(max(0.0, float(overall)), 1),
        }
