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
    # Common values offered as quick picks in the UI: ((value, label), ...)
    presets: tuple[tuple[float, str], ...] = field(default_factory=tuple)


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
    presets: tuple[tuple[float, str], ...] = (),
) -> Parameter:
    return Parameter(id, name, cat, unit, desc, min_v, max_v, typical, tags, derived, presets)


def _v(*values: float) -> tuple[tuple[float, str], ...]:
    """Unlabelled presets."""
    return tuple((v, "") for v in values)


C = ParameterCategory

PARAMETERS: dict[str, Parameter] = {p.id: p for p in [
    # ── CAMERA ────────────────────────────────────────────────────────────────
    _p("resolution_x", "Resolution X", C.CAMERA, "pixel",
       "Horizontal pixel count of the camera sensor (line length for line-scan cameras)",
       min_v=1, typical=(640, 12000), tags=("camera", "sensor", "resolution"),
       presets=((640, "VGA"), (720, "0.4 MP"), (1280, "1.3 MP"), (1440, "1.6 MP"),
                (2048, "3.2 MP / 2k line"), (2448, "5 MP"), (3072, "6.4 MP"),
                (4096, "12 MP / 4k line"), (5472, "20 MP"), (8192, "8k line"),
                (16384, "16k line"))),

    _p("resolution_y", "Resolution Y", C.CAMERA, "pixel",
       "Vertical pixel count of the camera sensor",
       min_v=1, typical=(480, 12000), tags=("camera", "sensor", "resolution"),
       presets=_v(480, 540, 1024, 1080, 1536, 2048, 3000, 3648)),

    _p("pixel_size", "Pixel Size", C.CAMERA, "μm",
       "Physical size of one pixel on the sensor (square assumed)",
       min_v=0.1, typical=(1.67, 20.0), tags=("camera", "sensor"),
       presets=((1.85, "IMX226"), (2.2, "MT9P031"), (2.4, "IMX178/183"), (2.74, "IMX541/530"),
                (3.45, "IMX264/250/304"), (4.8, "Python 1300"), (5.5, "CMV4000"),
                (5.86, "IMX174"), (6.9, "IMX287"), (7.0, "Line scan"), (10.0, "Line scan"),
                (14.0, "Line scan"))),

    _p("sensor_width", "Sensor Width", C.CAMERA, "mm",
       "Physical width of the image sensor",
       min_v=0.5, typical=(3.0, 50.0), tags=("camera", "sensor"),
       presets=((4.8, '1/3"'), (6.4, '1/2"'), (7.2, '1/1.8"'), (8.8, '2/3"'),
                (12.8, '1"'), (14.1, '1.1"'), (23.6, "APS-C"), (36.0, "Full frame"))),

    _p("sensor_height", "Sensor Height", C.CAMERA, "mm",
       "Physical height of the image sensor",
       min_v=0.5, typical=(2.0, 40.0), tags=("camera", "sensor"),
       presets=((3.6, '1/3"'), (4.8, '1/2"'), (5.4, '1/1.8"'), (6.6, '2/3"'),
                (9.6, '1"'), (10.3, '1.1"'), (15.6, "APS-C"), (24.0, "Full frame"))),

    _p("sensor_diagonal", "Sensor Diagonal", C.CAMERA, "mm",
       "Diagonal size of the image sensor (determines lens format compatibility)",
       min_v=0.5, tags=("camera", "sensor"), derived=True),

    _p("fps", "Frame Rate", C.CAMERA, "fps",
       "Maximum frames per second the camera can deliver",
       min_v=0.1, typical=(10, 2000), tags=("camera", "timing"),
       presets=_v(10, 15, 25, 30, 60, 90, 120, 200, 500)),

    _p("bit_depth", "Bit Depth", C.CAMERA, "bit",
       "Bit depth per pixel (grayscale or per channel)",
       min_v=1, max_v=16, typical=(8, 16), tags=("camera",),
       presets=_v(8, 10, 12, 16)),

    # ── LENS ──────────────────────────────────────────────────────────────────
    _p("focal_length", "Focal Length", C.LENS, "mm",
       "Effective focal length of the lens",
       min_v=0.5, typical=(8, 200), tags=("lens", "optics"),
       presets=_v(4, 6, 8, 12, 16, 25, 35, 50, 75, 100)),

    _p("magnification", "Magnification", C.LENS, "",
       "Ratio of sensor image size to real object size  |M| = sensor/object",
       min_v=0.001, typical=(0.01, 10.0), tags=("lens", "optics"),
       presets=((0.05, ""), (0.1, ""), (0.25, ""), (0.5, "Telecentric"),
                (1.0, "Telecentric 1×"), (2.0, "Telecentric 2×"))),

    _p("working_distance", "Working Distance", C.LENS, "mm",
       "Distance from the front of the lens to the object plane",
       min_v=1.0, typical=(10, 3000), tags=("lens", "optics"),
       presets=_v(50, 100, 150, 200, 300, 400, 500, 800, 1000)),

    _p("f_number", "F-Number", C.LENS, "",
       "Aperture f-number (focal length / aperture diameter)",
       min_v=0.7, typical=(1.4, 22), tags=("lens", "optics", "aperture"),
       presets=_v(1.4, 2.0, 2.8, 4.0, 5.6, 8.0, 11.0, 16.0)),

    _p("numerical_aperture", "Numerical Aperture", C.LENS, "",
       "Object-side numerical aperture of the imaging system",
       min_v=0.0001, typical=(0.01, 0.5), tags=("lens", "optics")),

    _p("distortion", "Distortion", C.LENS, "%",
       "Lens geometric distortion (negative = barrel, positive = pincushion)",
       typical=(-5.0, 5.0), tags=("lens",),
       presets=((-2.0, "Wide angle"), (-0.5, "Standard FA"), (-0.1, "Low distortion"),
                (0.05, "Telecentric"))),

    _p("image_circle", "Image Circle", C.LENS, "mm",
       "Diameter of the usable image circle projected by the lens",
       min_v=1.0, typical=(6, 55), tags=("lens", "sensor"),
       presets=((6.0, '1/3"'), (8.0, '1/2"'), (9.0, '1/1.8"'), (11.0, '2/3"'),
                (16.0, '1"'), (17.6, '1.1"'), (28.0, "APS-C"), (43.3, "Full frame"))),

    # ── OBJECT ────────────────────────────────────────────────────────────────
    _p("object_width", "Object Width", C.OBJECT, "mm",
       "Width of the object being imaged / inspected (web width for line scan)",
       min_v=0.001, tags=("object",),
       presets=_v(5, 10, 20, 50, 100, 200, 500, 1000)),

    _p("object_height", "Object Height", C.OBJECT, "mm",
       "Height of the object being imaged / inspected",
       min_v=0.001, tags=("object",),
       presets=_v(5, 10, 20, 50, 100, 200, 500)),

    _p("object_thickness", "Object Thickness", C.OBJECT, "mm",
       "Thickness or depth-range of the object (relevant for DOF)",
       min_v=0.0, tags=("object",),
       presets=_v(0.5, 1, 2, 5, 10, 20, 50)),

    _p("smallest_feature", "Smallest Feature", C.OBJECT, "mm",
       "Smallest feature that must be reliably detected or measured",
       min_v=0.0001, tags=("object", "inspection"),
       presets=_v(0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1.0)),

    _p("tolerance", "Tolerance Band", C.OBJECT, "mm",
       "Total tolerance band of the measured dimension (USL − LSL)",
       min_v=0.0001, tags=("object", "inspection"),
       presets=_v(0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0)),

    _p("required_accuracy", "Required Accuracy", C.OBJECT, "mm",
       "Required measurement / detection accuracy",
       min_v=0.0001, tags=("inspection",),
       presets=_v(0.001, 0.005, 0.01, 0.02, 0.05, 0.1)),

    # ── MOTION ────────────────────────────────────────────────────────────────
    _p("speed", "Object Speed", C.MOTION, "mm/s",
       "Velocity of the moving object relative to the camera",
       min_v=0.0, typical=(0, 5000), tags=("motion",),
       presets=((10, "0.6 m/min"), (50, "3 m/min"), (100, "6 m/min"), (200, "12 m/min"),
                (500, "30 m/min"), (1000, "60 m/min"), (2000, "120 m/min"),
                (5000, "300 m/min"))),

    _p("exposure_time", "Exposure Time", C.MOTION, "μs",
       "Camera electronic shutter / integration time",
       min_v=0.1, typical=(10, 100_000), tags=("motion", "camera"),
       presets=_v(5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000)),

    _p("motion_blur", "Motion Blur", C.MOTION, "mm",
       "Object displacement during exposure (motion blur in physical units)",
       min_v=0.0, tags=("motion",), derived=True),

    _p("blur_pixels", "Blur (pixels)", C.MOTION, "pixel",
       "Motion blur expressed in pixels at the current scale",
       min_v=0.0, tags=("motion",), derived=True),

    _p("max_blur_allowed", "Max Blur Allowed", C.MOTION, "pixel",
       "Largest motion blur the inspection tolerates (≤ 1 px for measurement)",
       min_v=0.01, tags=("motion",),
       presets=((0.25, "Precise gauging"), (0.5, "Measurement"), (1.0, "Standard"),
                (2.0, "Presence check"))),

    _p("max_exposure_time", "Max Exposure Time", C.MOTION, "μs",
       "Longest exposure that keeps motion blur within the allowed limit",
       min_v=0.0, tags=("motion", "camera"), derived=True),

    _p("frame_overlap", "Frame Overlap", C.MOTION, "%",
       "Overlap between consecutive frames along the motion direction (Y)",
       min_v=0.0, max_v=95.0, tags=("motion",),
       presets=_v(0, 10, 20, 30, 50)),

    _p("required_fps", "Required Frame Rate", C.MOTION, "fps",
       "Frame rate needed for gap-free coverage of a moving scene (motion along FOV Y)",
       min_v=0.0, tags=("motion", "timing"), derived=True),

    _p("conveyor_speed", "Conveyor Speed", C.MOTION, "m/min",
       "Conveyor belt speed in meters per minute",
       min_v=0.0, tags=("motion",),
       presets=_v(1, 5, 10, 20, 30, 60, 100, 200)),

    _p("encoder_resolution", "Encoder Resolution", C.MOTION, "pulse/mm",
       "Incremental encoder resolution in pulses per millimeter",
       min_v=0.0, tags=("motion",),
       presets=_v(1, 2, 5, 10, 20, 50, 100)),

    _p("line_rate", "Line Rate", C.MOTION, "kHz",
       "Line-scan trigger rate needed for square pixels at the current speed",
       min_v=0.0, tags=("motion", "linescan"), derived=True),

    _p("line_period", "Line Period", C.MOTION, "μs",
       "Time between two line triggers — the upper bound for line exposure",
       min_v=0.0, tags=("motion", "linescan"), derived=True),

    _p("max_line_rate", "Camera Max Line Rate", C.MOTION, "kHz",
       "Maximum line rate supported by the line-scan camera",
       min_v=0.1, tags=("camera", "linescan"),
       presets=_v(10, 20, 40, 80, 140, 200)),

    _p("encoder_pulses_per_line", "Encoder Pulses / Line", C.MOTION, "pulse",
       "Encoder pulses between two line triggers (divider setting for the frame grabber)",
       min_v=0.0, tags=("motion", "linescan"), derived=True),

    # ── IMAGING ───────────────────────────────────────────────────────────────
    _p("fov_margin", "FOV Margin", C.IMAGING, "%",
       "Extra field of view around the object for positioning tolerance",
       min_v=0.0, tags=("imaging", "fov"),
       presets=((0, "Fixtured part"), (10, "Good fixture"), (20, "Standard"),
                (30, "Loose positioning"), (50, "Random position"))),

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
       min_v=200, max_v=1100, typical=(400, 700), tags=("lighting", "optics"),
       presets=((365, "UV"), (405, "Violet"), (470, "Blue"), (525, "Green"),
                (550, "White (peak)"), (590, "Amber"), (625, "Red"), (660, "Deep red"),
                (850, "IR"), (940, "IR"))),

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

    _p("max_mm_per_pixel", "Max mm/pixel", C.INSPECTION, "mm/pixel",
       "Coarsest pixel scale that still meets the required accuracy (1/3 px sub-pixel)",
       min_v=0.0, tags=("inspection", "resolution"), derived=True),

    _p("min_resolution_x", "Min Resolution X", C.INSPECTION, "pixel",
       "Minimum horizontal pixel count that meets the required accuracy over FOV X",
       min_v=0.0, tags=("inspection", "resolution"), derived=True),
]}
