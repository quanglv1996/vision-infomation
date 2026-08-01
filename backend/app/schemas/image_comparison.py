"""Pydantic schemas for Image Comparison module."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class ImageMetrics(BaseModel):
    index: int
    name: str
    width: int
    height: int
    is_color: bool
    # Sharpness
    laplacian_variance: float
    tenengrad: float
    brenner: float
    fft_sharpness: float
    edge_density: float
    sharpness_score: float       # 0-100 normalized within batch
    # Brightness
    mean_brightness: float
    median_brightness: float
    std_brightness: float
    dynamic_range_pct: float
    brightness_score: float
    # Contrast
    michelson: float
    rms_contrast: float
    local_contrast: float
    contrast_score: float
    # Noise
    noise_std: float
    snr_db: float
    noise_score: float
    # Advanced
    entropy: float
    colorfulness: Optional[float]
    # Overall
    overall_score: float
    rank: int
    # Histograms (64-bin)
    histogram_bins: list[float]
    histogram_gray: list[float]
    histogram_r: Optional[list[float]]
    histogram_g: Optional[list[float]]
    histogram_b: Optional[list[float]]
    # Heatmaps (downsampled)
    focus_map: list[list[float]]
    focus_map_rows: int
    focus_map_cols: int
    noise_map: list[list[float]]
    noise_map_rows: int
    noise_map_cols: int


class DiffResult(BaseModel):
    img1_idx: int
    img2_idx: int
    mse: float
    psnr: float
    ssim: Optional[float]
    diff_map: list[list[float]]
    diff_map_rows: int
    diff_map_cols: int


class ComparisonResult(BaseModel):
    n_images: int
    metrics: list[ImageMetrics]
    sharpness_ranking: list[int]  # indices highest→lowest
    brightness_ranking: list[int]
    contrast_ranking: list[int]
    noise_ranking: list[int]      # lowest noise first
    overall_ranking: list[int]
    best_idx: int
    worst_idx: int
    diff_result: Optional[DiffResult]
    weights_used: dict[str, float]
