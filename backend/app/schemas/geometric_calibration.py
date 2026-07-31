"""Pydantic schemas for Geometric Camera Calibration module."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class IntrinsicResult(BaseModel):
    fx: float
    fy: float
    cx: float
    cy: float
    aspect_ratio: float
    camera_matrix: list[list[float]]  # 3×3


class DistortionResult(BaseModel):
    k1: float
    k2: float
    k3: float
    p1: float
    p2: float
    distortion_vector: list[float]
    max_distortion_px: float
    distortion_map: list[list[float]]
    distortion_map_rows: int
    distortion_map_cols: int


class PerspectiveResult(BaseModel):
    homography_matrix: list[list[float]]  # 3×3
    scale_x: float
    scale_y: float
    rotation_deg: float


class PixelCalibResult(BaseModel):
    mm_per_pixel: float
    pixel_per_mm: float
    fov_width_mm: float
    fov_height_mm: float
    measurement_accuracy_pct: float


class WorkingDistanceResult(BaseModel):
    estimated_wd_mm: float
    fov_width_mm: float
    fov_height_mm: float
    scale_error_pct: float


class CameraPoseResult(BaseModel):
    image_index: int
    roll_deg: float
    pitch_deg: float
    yaw_deg: float
    tx_mm: float
    ty_mm: float
    tz_mm: float
    reprojection_error: float


class LensVizResult(BaseModel):
    # Ideal (undistorted) grid — straight lines
    grid_x_ideal: list[float]
    grid_y_ideal: list[float]
    # Distorted positions of the same grid points
    grid_x_dist: list[float]
    grid_y_dist: list[float]
    displacements: list[float]
    grid_n: int         # points per side
    image_width: int
    image_height: int


class ReprojectionQuality(BaseModel):
    rms_error: float
    mean_error: float
    max_error: float
    per_image_errors: list[float]
    calibration_score: float
    status: str  # excellent / good / acceptable / poor


class GeometricCalibrationResult(BaseModel):
    pattern_type: str
    board_cols: int
    board_rows: int
    square_size_mm: float
    num_images_total: int
    num_images_used: int
    image_width: int
    image_height: int
    intrinsic: IntrinsicResult
    distortion: DistortionResult
    perspective: PerspectiveResult
    pixel_calib: Optional[PixelCalibResult]
    working_distance: Optional[WorkingDistanceResult]
    poses: list[CameraPoseResult]
    lens_viz: LensVizResult
    quality: ReprojectionQuality
    recommendations: list[str]
    export_yaml: str
    export_json: str
    export_opencv_xml: str
