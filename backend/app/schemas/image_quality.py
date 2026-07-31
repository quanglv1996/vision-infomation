"""Pydantic schemas for Image Quality Evaluation module."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class SharpnessResult(BaseModel):
    laplacian_variance: float
    tenengrad: float
    brenner: float
    sobel_energy: float
    fft_sharpness: float    # high-freq energy ratio
    sharpness_score: float  # 0-100 normalised
    status: str             # sharp / acceptable / blurry
    focus_map: list[list[float]]
    focus_map_rows: int
    focus_map_cols: int


class BlurResult(BaseModel):
    blur_type: str           # none / motion / defocus / gaussian
    severity_score: float    # 0-1  (0=none, 1=severe)
    motion_angle: Optional[float]   # degrees
    motion_length: Optional[float]  # px estimate
    blur_map: list[list[float]]
    blur_map_rows: int
    blur_map_cols: int


class NoiseQualityResult(BaseModel):
    estimated_std: float       # Gaussian noise σ
    salt_pepper_pct: float
    noise_score: float         # 0-100 (higher=cleaner)
    noise_map: list[list[float]]
    noise_map_rows: int
    noise_map_cols: int


class ContrastResult(BaseModel):
    michelson: float        # (max-min)/(max+min)
    rms: float              # RMS contrast 0-1
    local_mean: float       # mean local contrast
    histogram_spread: float # 0-1, how spread the histogram is
    contrast_score: float   # 0-100
    status: str             # high / medium / low


class DynamicRangeQuality(BaseModel):
    dynamic_range_stops: float
    saturated_pct: float
    shadow_clipped_pct: float
    highlight_clipped_pct: float
    effective_range_pct: float  # % of histogram range actually used


class SNRCNRResult(BaseModel):
    snr_db: float
    cnr_db: float
    snr_score: float  # 0-100
    status: str       # excellent / good / poor


class ExposureResult(BaseModel):
    mean_brightness_pct: float
    exposure_score: float   # 0-100 (peak at ~50%)
    is_overexposed: bool
    is_underexposed: bool
    overexposed_pct: float  # % saturated pixels
    underexposed_pct: float # % black-clipped pixels
    status: str             # pass / warning / fail


class ColorResult(BaseModel):
    histogram_bins: list[float]
    histogram_r: list[float]
    histogram_g: list[float]
    histogram_b: list[float]
    mean_r: float
    mean_g: float
    mean_b: float
    white_balance_score: float  # 0-100
    has_color_cast: bool
    dominant_cast: Optional[str]  # red / green / blue


class ImageStatistics(BaseModel):
    mean: float
    median: float
    std: float
    variance: float
    entropy: float
    skewness: float
    kurtosis: float
    min_val: float
    max_val: float
    percentile_5: float
    percentile_95: float


class ApplicationScores(BaseModel):
    ai_inspection: float
    ocr: float
    measurement: float
    object_detection: float
    defect_detection: float
    pattern_matching: float


class ImageQualityResult(BaseModel):
    is_color: bool
    image_shape: list[int]
    bit_depth: int
    overall_score: float
    quality_category: str       # Excellent / Good / Acceptable / Poor
    sharpness: SharpnessResult
    blur: BlurResult
    noise: NoiseQualityResult
    contrast: ContrastResult
    dynamic_range: DynamicRangeQuality
    snr_cnr: SNRCNRResult
    exposure: ExposureResult
    color: Optional[ColorResult]
    statistics: ImageStatistics
    application_scores: ApplicationScores
    recommendations: list[str]
