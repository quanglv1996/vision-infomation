"""
Formula library for the Machine Vision Knowledge Base.

Each Formula declares its inputs, its single output, and a Python expression string.
Inverse formulas are derived automatically using SymPy at module load time so the
engine can solve backwards (target-driven) without any hard-coded logic.
"""
from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# ── Safe evaluation namespace ─────────────────────────────────────────────────
SAFE_MATH: dict = {
    "sqrt": math.sqrt,
    "log": math.log,
    "log10": math.log10,
    "exp": math.exp,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "atan": math.atan,
    "atan2": math.atan2,
    "asin": math.asin,
    "acos": math.acos,
    "pi": math.pi,
    "e": math.e,
    "abs": abs,
    "Abs": abs,
    "sign": lambda x: (1 if x > 0 else -1 if x < 0 else 0),
}


def _sympy_derive_inverses(
    inputs: list[str], output: str, expression: str
) -> dict[str, str]:
    """Return {input_id: inverse_expression_string} using SymPy symbolic solving."""
    try:
        import sympy as sp  # soft dependency

        syms = {name: sp.Symbol(name, positive=True) for name in inputs + [output]}
        sym_expr = sp.sympify(expression, locals=syms)
        eq = sp.Eq(syms[output], sym_expr)

        inverses: dict[str, str] = {}
        for inp in inputs:
            try:
                solutions = sp.solve(eq, syms[inp])
                real_pos = [
                    s for s in solutions
                    if s.is_real is not False and s.is_negative is not True
                ]
                if real_pos:
                    sol_str = str(real_pos[0])
                    # Validate it compiles as Python
                    compile(sol_str, "<sympy-inverse>", "eval")
                    inverses[inp] = sol_str
            except Exception:
                pass
        return inverses
    except ImportError:
        logger.warning("SymPy not installed — inverse formulas unavailable")
        return {}
    except Exception as exc:
        logger.debug("SymPy failed for '%s': %s", expression, exc)
        return {}


@dataclass
class Formula:
    """A single formula connecting input parameters to one output parameter."""

    id: str
    name: str
    description: str
    inputs: list[str]   # ordered list of input parameter IDs
    output: str         # single output parameter ID
    expression: str     # Python expression string (uses input names as variables)
    category: str = "general"
    notes: str = ""
    priority: int = 0   # lower value = tried first when multiple formulas target same output

    # Auto-populated at __post_init__
    inverse_expressions: dict[str, str] = field(default_factory=dict, init=False)
    _fwd_code: object = field(default=None, init=False, repr=False)
    _inv_codes: dict[str, object] = field(default_factory=dict, init=False, repr=False)

    def __post_init__(self) -> None:
        self._fwd_code = compile(self.expression, f"<formula:{self.id}>", "eval")
        self.inverse_expressions = _sympy_derive_inverses(
            self.inputs, self.output, self.expression
        )
        for inp, expr in self.inverse_expressions.items():
            self._inv_codes[inp] = compile(expr, f"<inv:{self.id}:{inp}>", "eval")

    # ── Evaluation helpers ────────────────────────────────────────────────────

    def evaluate(self, values: dict[str, float]) -> float:
        ns = {**SAFE_MATH, **{k: values[k] for k in self.inputs}}
        return float(eval(self._fwd_code, {"__builtins__": None}, ns))  # noqa: S307

    def evaluate_inverse(self, solve_for: str, values: dict[str, float]) -> float:
        if solve_for not in self._inv_codes:
            raise ValueError(f"No inverse for '{solve_for}' in formula '{self.id}'")
        ns = {**SAFE_MATH, **{k: v for k, v in values.items() if k != solve_for}}
        return float(eval(self._inv_codes[solve_for], {"__builtins__": None}, ns))  # noqa: S307

    def can_calculate(self, known: set[str]) -> bool:
        """True when all inputs are known → can compute output."""
        return all(inp in known for inp in self.inputs)

    def can_invert_for(self, solve_for: str, known: set[str]) -> bool:
        """True when output + all other inputs are known → can solve for *solve_for*."""
        if solve_for not in self.inputs:
            return False
        if solve_for not in self.inverse_expressions:
            return False
        required = (set(self.inputs) | {self.output}) - {solve_for}
        return required.issubset(known)

    @property
    def all_parameters(self) -> list[str]:
        return self.inputs + [self.output]


# ── Helper factory ────────────────────────────────────────────────────────────

def _f(
    id: str,
    name: str,
    desc: str,
    inputs: list[str],
    output: str,
    expr: str,
    cat: str = "general",
    notes: str = "",
    priority: int = 0,
) -> Formula:
    return Formula(
        id=id, name=name, description=desc,
        inputs=inputs, output=output, expression=expr,
        category=cat, notes=notes, priority=priority,
    )


# ── Formula catalogue ─────────────────────────────────────────────────────────
# Expressions are pure Python; only SAFE_MATH names + parameter names are in scope.

FORMULAS: list[Formula] = [

    # ── Camera / Sensor ────────────────────────────────────────────────────────

    _f("sensor_width_from_resolution",
       "Sensor Width from Resolution",
       "Derive sensor width from pixel count and pixel size",
       ["resolution_x", "pixel_size"], "sensor_width",
       "resolution_x * pixel_size / 1000",
       # pixel_size [μm] / 1000 → mm ; × resolution_x [px] = sensor_width [mm]
       cat="camera"),

    _f("sensor_height_from_resolution",
       "Sensor Height from Resolution",
       "Derive sensor height from pixel count and pixel size",
       ["resolution_y", "pixel_size"], "sensor_height",
       "resolution_y * pixel_size / 1000",
       cat="camera"),

    _f("sensor_diagonal_from_dimensions",
       "Sensor Diagonal",
       "Calculate sensor diagonal from width and height (Pythagoras)",
       ["sensor_width", "sensor_height"], "sensor_diagonal",
       "sqrt(sensor_width**2 + sensor_height**2)",
       cat="camera"),

    # ── Optics / Lens ─────────────────────────────────────────────────────────

    _f("magnification_from_thin_lens",
       "Magnification (thin-lens)",
       "Optical magnification from focal length and working distance",
       ["focal_length", "working_distance"], "magnification",
       "focal_length / (working_distance - focal_length)",
       cat="lens",
       notes="Thin-lens formula.  WD must be > focal_length (real image).",
       priority=1),

    _f("magnification_from_sensor_fov",
       "Magnification from Sensor & FOV",
       "Derive magnification from sensor width and horizontal FOV",
       ["sensor_width", "fov_x"], "magnification",
       "sensor_width / fov_x",
       cat="imaging",
       priority=0),

    _f("magnification_from_pixel_scale",
       "Magnification from Pixel Size & Scale",
       "Derive magnification from pixel size and mm/pixel ratio",
       ["pixel_size", "mm_per_pixel"], "magnification",
       "(pixel_size / 1000) / mm_per_pixel",
       cat="imaging",
       priority=2),

    _f("working_distance_from_focal_mag",
       "Working Distance from Focal Length",
       "WD = f × (1 + 1/M)  (thin lens rearranged)",
       ["focal_length", "magnification"], "working_distance",
       "focal_length * (1 + 1 / magnification)",
       cat="lens"),

    _f("focal_length_from_wd_mag",
       "Focal Length from WD & Magnification",
       "f = WD × M / (1 + M)  (thin lens rearranged)",
       ["working_distance", "magnification"], "focal_length",
       "working_distance * magnification / (1 + magnification)",
       cat="lens"),

    # ── Field of View ─────────────────────────────────────────────────────────

    _f("fov_x_from_sensor_mag",
       "FOV X from Sensor Width & Magnification",
       "Horizontal FOV = sensor_width / magnification",
       ["sensor_width", "magnification"], "fov_x",
       "sensor_width / magnification",
       cat="imaging"),

    _f("fov_y_from_sensor_mag",
       "FOV Y from Sensor Height & Magnification",
       "Vertical FOV = sensor_height / magnification",
       ["sensor_height", "magnification"], "fov_y",
       "sensor_height / magnification",
       cat="imaging"),

    _f("fov_x_from_resolution_scale",
       "FOV X from Resolution & mm/pixel",
       "FOV X = resolution_x × mm_per_pixel",
       ["resolution_x", "mm_per_pixel"], "fov_x",
       "resolution_x * mm_per_pixel",
       cat="imaging", priority=1),

    _f("fov_y_from_resolution_scale",
       "FOV Y from Resolution & mm/pixel",
       "FOV Y = resolution_y × mm_per_pixel",
       ["resolution_y", "mm_per_pixel"], "fov_y",
       "resolution_y * mm_per_pixel",
       cat="imaging", priority=1),

    _f("fov_x_from_object_margin",
       "FOV X from Object Width (20 % margin)",
       "Minimum FOV to cover the object with 20 % alignment margin",
       ["object_width"], "fov_x",
       "object_width * 1.2",
       cat="imaging",
       notes="Rule of thumb: 20 % margin for alignment tolerance.",
       priority=5),

    # ── Scale factor ──────────────────────────────────────────────────────────

    _f("mm_per_pixel_from_fov_resolution",
       "mm/pixel from FOV & Resolution",
       "mm_per_pixel = fov_x / resolution_x",
       ["fov_x", "resolution_x"], "mm_per_pixel",
       "fov_x / resolution_x",
       cat="imaging"),

    _f("mm_per_pixel_from_pixel_size_mag",
       "mm/pixel from Pixel Size & Magnification",
       "mm_per_pixel = pixel_size [μm] / (1000 × magnification)",
       ["pixel_size", "magnification"], "mm_per_pixel",
       "pixel_size / (1000 * magnification)",
       cat="imaging", priority=1),

    _f("pixel_per_mm_from_scale",
       "pixel/mm (spatial frequency)",
       "pixel_per_mm = 1 / mm_per_pixel",
       ["mm_per_pixel"], "pixel_per_mm",
       "1.0 / mm_per_pixel",
       cat="imaging"),

    # ── Resolution requirements ───────────────────────────────────────────────

    _f("pixels_per_feature_calc",
       "Pixels per Feature",
       "How many pixels cover the smallest feature",
       ["smallest_feature", "mm_per_pixel"], "pixels_per_feature",
       "smallest_feature / mm_per_pixel",
       cat="imaging"),

    _f("pixels_per_object_x_calc",
       "Pixels per Object (horizontal)",
       "How many pixels cover the full object width",
       ["object_width", "mm_per_pixel"], "pixels_per_object_x",
       "object_width / mm_per_pixel",
       cat="imaging"),

    _f("required_resolution_x_from_fov_feature",
       "Required Resolution X",
       "Minimum resolution to resolve smallest feature (Nyquist: 3 px/feature)",
       ["fov_x", "smallest_feature"], "resolution_x",
       "fov_x / smallest_feature * 3",
       cat="imaging",
       notes="Nyquist criterion: 3 pixels per feature minimum for reliable detection.",
       priority=10),

    # ── Motion blur ───────────────────────────────────────────────────────────

    _f("motion_blur_from_speed_exposure",
       "Motion Blur",
       "Motion blur distance = speed × exposure_time",
       ["speed", "exposure_time"], "motion_blur",
       "speed * exposure_time * 1e-6",
       # speed [mm/s] × exposure [μs × 1e-6 s/μs] = distance [mm]
       cat="motion"),

    _f("blur_pixels_from_motion_blur",
       "Motion Blur in Pixels",
       "Blur in pixels = motion_blur / mm_per_pixel",
       ["motion_blur", "mm_per_pixel"], "blur_pixels",
       "motion_blur / mm_per_pixel",
       cat="motion"),

    _f("speed_from_conveyor",
       "Speed from Conveyor Belt Speed",
       "Convert conveyor speed (m/min) → object speed (mm/s)",
       ["conveyor_speed"], "speed",
       "conveyor_speed * 1000 / 60",
       cat="motion"),

    # ── Optics / DOF ──────────────────────────────────────────────────────────

    _f("dof_from_aperture",
       "Depth of Field",
       "DOF using one pixel as circle of confusion criterion",
       ["f_number", "pixel_size", "magnification"], "dof",
       "2 * f_number * (pixel_size / 1000) * (1 + magnification) / magnification**2",
       # CoC = pixel_size [μm] / 1000 = [mm]; standard DOF formula: 2·N·c·(1+M)/M²
       cat="optics",
       notes="Circle of confusion = 1 pixel.  Lower f_number or magnification → smaller DOF."),

    _f("hyperfocal_from_fnumber",
       "Hyperfocal Distance",
       "H = f² / (N × c) + f    where c = pixel_size as CoC",
       ["focal_length", "f_number", "pixel_size"], "hyperfocal_distance",
       "focal_length**2 / (f_number * pixel_size / 1000) + focal_length",
       cat="optics"),

    # ── Diffraction ───────────────────────────────────────────────────────────

    _f("airy_disk_from_fnumber_wavelength",
       "Airy Disk Diameter",
       "Airy disk diameter = 2.44 × f_number × λ  (λ in μm)",
       ["wavelength", "f_number"], "airy_disk",
       "2.44 * f_number * wavelength / 1000",
       # wavelength [nm] / 1000 = [μm];  airy_disk [μm] = 2.44 × N × λ[μm]
       cat="optics"),

    _f("diffraction_limit_from_wavelength",
       "Diffraction Limit",
       "Maximum spatial frequency resolvable (Rayleigh criterion)",
       ["wavelength", "f_number"], "diffraction_limit",
       "1e6 / (1.22 * wavelength * f_number)",
       # result in lp/mm;  wavelength [nm]
       cat="optics"),

    _f("numerical_aperture_calc",
       "Numerical Aperture (object side)",
       "Object-side NA ≈ M / (2 × f_number)",
       ["magnification", "f_number"], "numerical_aperture",
       "magnification / (2 * f_number)",
       cat="optics"),

    # ── Inspection quality ────────────────────────────────────────────────────

    _f("detectable_feature_from_scale",
       "Minimum Detectable Feature",
       "Minimum detectable feature = 3 × mm_per_pixel  (Nyquist)",
       ["mm_per_pixel"], "detectable_feature",
       "mm_per_pixel * 3",
       cat="inspection",
       notes="3 pixels per feature is the practical Nyquist minimum."),

    _f("repeatability_from_scale",
       "System Repeatability",
       "Estimate ≈ mm_per_pixel × 0.1  (sub-pixel algorithm)",
       ["mm_per_pixel"], "repeatability",
       "mm_per_pixel * 0.1",
       cat="inspection",
       notes="Rule of thumb: centroid/edge algorithms achieve ~1/10 pixel repeatability."),

    _f("measurement_error_from_scale",
       "Measurement Error",
       "Estimate ≈ mm_per_pixel / 3  (edge-based sub-pixel)",
       ["mm_per_pixel"], "measurement_error",
       "mm_per_pixel / 3",
       cat="inspection"),
]

# Build lookup index
FORMULA_BY_ID: dict[str, Formula] = {f.id: f for f in FORMULAS}

# Group by output parameter
FORMULAS_BY_OUTPUT: dict[str, list[Formula]] = {}
for _formula in FORMULAS:
    FORMULAS_BY_OUTPUT.setdefault(_formula.output, []).append(_formula)
    FORMULAS_BY_OUTPUT[_formula.output].sort(key=lambda x: x.priority)

logger.debug("Loaded %d formulas", len(FORMULAS))
