"""
Parameter definitions for the Machine Vision Knowledge Base.
Every parameter in the system is described here — this is the single source of truth.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class ParameterCategory(str, Enum):
    CAMERA = "Camera"
    LENS = "Lens"
    OBJECT = "Object"
    MOTION = "Motion"
    IMAGING = "Imaging"
    OPTICS = "Optics"
    LIGHTING = "Lighting"
    INSPECTION = "Inspection"


@dataclass(frozen=True)
class Parameter:
    id: str
    name: str
    category: ParameterCategory
    unit: str
    description: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    typical_range: Optional[tuple[float, float]] = None
    tags: tuple[str, ...] = field(default_factory=tuple)
    is_derived: bool = False  # True = always computed, never directly set


def _p(
    id: str,
    name: str,
    cat: ParameterCategory,
    unit: str,
    desc: str,
    min_v: Optional[float] = None,
    max_v: Optional[float] = None,
    typical: Optional[tuple[float, float]] = None,
    tags: tuple[str, ...] = (),
    derived: bool = False,
) -> Parameter:
    return Parameter(id, name, cat, unit, desc, min_v, max_v, typical, tags, derived)


C = ParameterCategory

PARAMETERS: dict[str, Parameter] = {p.id: p for p in [
    # ── CAMERA ────────────────────────────────────────────────────────────────
    _p("resolution_x", "Resolution X", C.CAMERA, "pixel",
       "Horizontal pixel count of the camera sensor",
       min_v=1, typical=(640, 12000), tags=("camera", "sensor", "resolution")),

    _p("resolution_y", "Resolution Y", C.CAMERA, "pixel",
       "Vertical pixel count of the camera sensor",
       min_v=1, typical=(480, 12000), tags=("camera", "sensor", "resolution")),

    _p("pixel_size", "Pixel Size", C.CAMERA, "μm",
       "Physical size of one pixel on the sensor (square assumed)",
       min_v=0.1, typical=(1.67, 20.0), tags=("camera", "sensor")),

    _p("sensor_width", "Sensor Width", C.CAMERA, "mm",
       "Physical width of the image sensor",
       min_v=0.5, typical=(3.0, 50.0), tags=("camera", "sensor")),

    _p("sensor_height", "Sensor Height", C.CAMERA, "mm",
       "Physical height of the image sensor",
       min_v=0.5, typical=(2.0, 40.0), tags=("camera", "sensor")),

    _p("sensor_diagonal", "Sensor Diagonal", C.CAMERA, "mm",
       "Diagonal size of the image sensor (determines lens format compatibility)",
       min_v=0.5, tags=("camera", "sensor"), derived=True),

    _p("fps", "Frame Rate", C.CAMERA, "fps",
       "Camera frames per second",
       min_v=0.1, typical=(10, 2000), tags=("camera", "timing")),

    _p("bit_depth", "Bit Depth", C.CAMERA, "bit",
       "Bit depth per pixel (grayscale or per channel)",
       min_v=1, max_v=16, typical=(8, 16), tags=("camera",)),

    # ── LENS ──────────────────────────────────────────────────────────────────
    _p("focal_length", "Focal Length", C.LENS, "mm",
       "Effective focal length of the lens",
       min_v=0.5, typical=(8, 200), tags=("lens", "optics")),

    _p("magnification", "Magnification", C.LENS, "",
       "Ratio of sensor image size to real object size  |M| = sensor/object",
       min_v=0.001, typical=(0.01, 10.0), tags=("lens", "optics")),

    _p("working_distance", "Working Distance", C.LENS, "mm",
       "Distance from the front of the lens to the object plane",
       min_v=1.0, typical=(10, 3000), tags=("lens", "optics")),

    _p("f_number", "F-Number", C.LENS, "",
       "Aperture f-number (focal length / aperture diameter)",
       min_v=0.7, typical=(1.4, 22), tags=("lens", "optics", "aperture")),

    _p("numerical_aperture", "Numerical Aperture", C.LENS, "",
       "Object-side numerical aperture of the imaging system",
       min_v=0.0001, typical=(0.01, 0.5), tags=("lens", "optics")),

    _p("distortion", "Distortion", C.LENS, "%",
       "Lens geometric distortion (negative = barrel, positive = pincushion)",
       typical=(-5.0, 5.0), tags=("lens",)),

    _p("image_circle", "Image Circle", C.LENS, "mm",
       "Diameter of the usable image circle projected by the lens",
       min_v=1.0, typical=(6, 55), tags=("lens", "sensor")),

    # ── OBJECT ────────────────────────────────────────────────────────────────
    _p("object_width", "Object Width", C.OBJECT, "mm",
       "Width of the object being imaged / inspected",
       min_v=0.001, tags=("object",)),

    _p("object_height", "Object Height", C.OBJECT, "mm",
       "Height of the object being imaged / inspected",
       min_v=0.001, tags=("object",)),

    _p("object_thickness", "Object Thickness", C.OBJECT, "mm",
       "Thickness or depth-range of the object (relevant for DOF)",
       min_v=0.0, tags=("object",)),

    _p("smallest_feature", "Smallest Feature", C.OBJECT, "mm",
       "Smallest feature that must be reliably detected or measured",
       min_v=0.0001, tags=("object", "inspection")),

    _p("required_accuracy", "Required Accuracy", C.OBJECT, "mm",
       "Required measurement / detection accuracy",
       min_v=0.0001, tags=("inspection",)),

    # ── MOTION ────────────────────────────────────────────────────────────────
    _p("speed", "Object Speed", C.MOTION, "mm/s",
       "Velocity of the moving object relative to the camera",
       min_v=0.0, typical=(0, 5000), tags=("motion",)),

    _p("exposure_time", "Exposure Time", C.MOTION, "μs",
       "Camera electronic shutter / integration time",
       min_v=0.1, typical=(10, 100_000), tags=("motion", "camera")),

    _p("motion_blur", "Motion Blur", C.MOTION, "mm",
       "Object displacement during exposure (motion blur in physical units)",
       min_v=0.0, tags=("motion",), derived=True),

    _p("blur_pixels", "Blur (pixels)", C.MOTION, "pixel",
       "Motion blur expressed in pixels at the current scale",
       min_v=0.0, tags=("motion",), derived=True),

    _p("conveyor_speed", "Conveyor Speed", C.MOTION, "m/min",
       "Conveyor belt speed in meters per minute",
       min_v=0.0, tags=("motion",)),

    _p("encoder_resolution", "Encoder Resolution", C.MOTION, "pulse/mm",
       "Incremental encoder resolution in pulses per millimeter",
       min_v=0.0, tags=("motion",)),

    # ── IMAGING ───────────────────────────────────────────────────────────────
    _p("fov_x", "FOV X", C.IMAGING, "mm",
       "Horizontal field of view at the object plane",
       min_v=0.001, tags=("imaging", "fov")),

    _p("fov_y", "FOV Y", C.IMAGING, "mm",
       "Vertical field of view at the object plane",
       min_v=0.001, tags=("imaging", "fov")),

    _p("mm_per_pixel", "mm/pixel", C.IMAGING, "mm/pixel",
       "Physical size represented by one pixel (spatial scale factor)",
       min_v=0.0001, tags=("imaging", "resolution"), derived=True),

    _p("pixel_per_mm", "pixel/mm", C.IMAGING, "pixel/mm",
       "Spatial frequency: number of pixels per millimeter",
       min_v=0.0001, tags=("imaging", "resolution"), derived=True),

    _p("pixels_per_feature", "Pixels per Feature", C.IMAGING, "pixel",
       "Number of pixels covering the smallest feature",
       min_v=0.001, tags=("imaging", "inspection"), derived=True),

    _p("pixels_per_object_x", "Pixels per Object X", C.IMAGING, "pixel",
       "Number of pixels covering the full object width",
       min_v=0.001, tags=("imaging",), derived=True),

    # ── OPTICS ────────────────────────────────────────────────────────────────
    _p("dof", "Depth of Field", C.OPTICS, "mm",
       "Total depth of field — range in Z where image remains acceptably sharp",
       min_v=0.001, tags=("optics", "dof"), derived=True),

    _p("hyperfocal_distance", "Hyperfocal Distance", C.OPTICS, "mm",
       "Nearest focus distance at which objects at infinity are acceptably sharp",
       min_v=0.001, tags=("optics",), derived=True),

    _p("airy_disk", "Airy Disk Diameter", C.OPTICS, "μm",
       "Diameter of the Airy disk — diffraction-limited point spread function",
       min_v=0.001, tags=("optics", "diffraction"), derived=True),

    _p("diffraction_limit", "Diffraction Limit", C.OPTICS, "lp/mm",
       "Maximum spatial frequency resolvable due to diffraction",
       min_v=0.001, tags=("optics", "diffraction"), derived=True),

    # ── LIGHTING ──────────────────────────────────────────────────────────────
    _p("wavelength", "Wavelength", C.LIGHTING, "nm",
       "Peak wavelength of the illumination source",
       min_v=200, max_v=1100, typical=(400, 700), tags=("lighting", "optics")),

    # ── INSPECTION ────────────────────────────────────────────────────────────
    _p("repeatability", "Repeatability", C.INSPECTION, "mm",
       "Expected measurement repeatability (≈ 1/10 pixel sub-pixel accuracy)",
       min_v=0.0, tags=("inspection",), derived=True),

    _p("measurement_error", "Measurement Error", C.INSPECTION, "mm",
       "Expected measurement error (≈ 1/3 pixel typical for edge-based methods)",
       min_v=0.0, tags=("inspection",), derived=True),

    _p("detectable_feature", "Detectable Feature", C.INSPECTION, "mm",
       "Minimum feature size detectable with current system settings",
       min_v=0.0001, tags=("inspection",), derived=True),
]}
