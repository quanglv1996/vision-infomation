"""Pydantic schemas for Color Calibration module."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class WhiteBalanceResult(BaseModel):
    r_gain: float
    g_gain: float
    b_gain: float
    mean_r: float
    mean_g: float
    mean_b: float
    color_temperature_k: float
    tint: float           # negative=green shift, positive=magenta shift
    wb_score: float       # 0-100 (100=perfectly neutral)
    status: str           # balanced / warm / cool / tinted


class GrayBalanceResult(BaseModel):
    neutrality_error_pct: float
    r_deviation_pct: float
    g_deviation_pct: float
    b_deviation_pct: float
    gray_line_slope: float   # ideal=1.0
    status: str              # neutral / slight / moderate / severe


class ColorPatch(BaseModel):
    patch_id: int
    name: str
    measured_rgb: list[float]   # [R, G, B] 0-255
    reference_rgb: list[float]
    measured_lab: list[float]
    reference_lab: list[float]
    delta_e_76: float
    delta_e_94: float
    delta_e_2000: float
    status: str             # pass / warning / fail


class ColorCheckerResult(BaseModel):
    patches: list[ColorPatch]
    mean_delta_e_76: float
    mean_delta_e_94: float
    mean_delta_e_2000: float
    max_delta_e_2000: float
    pass_count: int
    warning_count: int
    fail_count: int
    accuracy_score: float
    detection_method: str   # grid / auto


class GammaResult(BaseModel):
    estimated_gamma: float
    recommended_gamma: float
    response_x: list[float]  # 0-1 input levels
    response_y: list[float]  # measured output (0-1)
    ideal_y: list[float]     # ideal sRGB at each level
    linearity_error_pct: float


class SaturationResult(BaseModel):
    mean_saturation_pct: float
    mean_hue_deg: float
    mean_value_pct: float
    saturation_histogram: list[float]  # 32 bins
    hue_histogram: list[float]         # 36 bins (0-360°)


class ColorUniformityResult(BaseModel):
    spatial_uniformity_pct: float
    illumination_uniformity_pct: float
    heatmap: list[list[float]]
    heatmap_rows: int
    heatmap_cols: int
    max_variation_pct: float
    status: str  # excellent / good / acceptable / poor


class WhitePointResult(BaseModel):
    chromaticity_x: float
    chromaticity_y: float
    color_temperature_k: float
    tint: float
    illuminant: str          # D65 / D50 / A / F11 / Unknown


class ColorSpaceResult(BaseModel):
    histogram_bins: list[float]
    histogram_r: list[float]
    histogram_g: list[float]
    histogram_b: list[float]
    lab_l_mean: float
    lab_a_mean: float
    lab_b_mean: float
    lab_l_std: float
    lab_a_std: float
    lab_b_std: float
    hsv_hue_mean: float
    hsv_sat_mean: float
    hsv_val_mean: float
    xyz_X: float
    xyz_Y: float
    xyz_Z: float


class ColorCalibrationResult(BaseModel):
    image_type: str
    image_width: int
    image_height: int
    bit_depth: int
    white_balance: WhiteBalanceResult
    gray_balance: GrayBalanceResult
    gamma: GammaResult
    saturation: SaturationResult
    uniformity: ColorUniformityResult
    white_point: WhitePointResult
    color_space: ColorSpaceResult
    color_checker: Optional[ColorCheckerResult]
    recommendations: list[str]
    export_json: str
    export_csv: str
