"""Pydantic schemas for Lighting Calibration module."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class BrightnessStats(BaseModel):
    mean: float
    median: float
    min_val: float
    max_val: float
    std: float
    pct_of_full_scale: float
    status: str  # pass / warning / fail


class HistogramResult(BaseModel):
    bins: list[float]        # 256 bin centres
    counts: list[float]      # normalised % per bin
    underexposed_pct: float
    overexposed_pct: float
    clipping_low: bool
    clipping_high: bool
    peak_bin: int


class UniformityResult(BaseModel):
    uniformity_min_max: float   # Min/Max × 100
    uniformity_cv: float        # (1 – Std/Mean) × 100
    status: str                 # excellent / good / acceptable / bad
    heatmap_data: list[list[float]]
    heatmap_rows: int
    heatmap_cols: int


class HotspotInfo(BaseModel):
    x: int
    y: int
    width: int
    height: int
    severity: float
    type: str   # bright / shadow / gradient


class HotspotResult(BaseModel):
    hotspots: list[HotspotInfo]
    severity_score: float
    heatmap_data: list[list[float]]
    heatmap_rows: int
    heatmap_cols: int


class NoiseResult(BaseModel):
    spatial_mean: float
    spatial_std: float
    temporal_mean: float
    temporal_std: float
    noise_map: list[list[float]]
    noise_map_rows: int
    noise_map_cols: int


class SNRResult(BaseModel):
    snr_linear: float
    snr_db: float
    status: str  # excellent / good / poor


class FlickerResult(BaseModel):
    brightness_over_time: list[float]
    frame_indices: list[int]
    mean: float
    std: float
    has_flicker: bool
    flicker_pct: float
    frequency_estimate: Optional[float]
    fft_frequencies: list[float]
    fft_amplitudes: list[float]


class DynamicRangeResult(BaseModel):
    effective_dr_stops: float
    usable_dr_stops: float
    signal_mean: float
    noise_floor: float


class LightingAnalysisResult(BaseModel):
    num_frames: int
    image_shape: list[int]
    bit_depth: int
    brightness: BrightnessStats
    histogram: HistogramResult
    uniformity: UniformityResult
    hotspots: HotspotResult
    noise: NoiseResult
    snr: SNRResult
    flicker: Optional[FlickerResult]
    dynamic_range: Optional[DynamicRangeResult]
    recommendations: list[str]
    overall_status: str  # pass / warning / fail
