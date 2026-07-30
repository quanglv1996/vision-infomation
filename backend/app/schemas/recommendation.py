"""Camera and lens recommendation schemas."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel


class RecommendRequest(BaseModel):
    required_fov_x: Optional[float] = None         # mm
    required_fov_y: Optional[float] = None         # mm
    required_accuracy: Optional[float] = None      # mm
    working_distance: Optional[float] = None       # mm
    smallest_feature: Optional[float] = None       # mm
    max_blur_pixels: float = 1.0                   # pixels
    speed: Optional[float] = None                  # mm/s


class CameraOut(BaseModel):
    id: str
    name: str
    brand: str
    resolution_x: int
    resolution_y: int
    pixel_size: float        # μm
    sensor_width: float      # mm
    sensor_height: float     # mm
    fps: float
    bit_depth: int
    sensor_format: str
    interface: str
    notes: str = ""


class LensOut(BaseModel):
    id: str
    name: str
    brand: str
    focal_length: float      # mm
    min_f_number: float
    max_f_number: float
    min_working_distance: float  # mm
    max_sensor_format: str
    image_circle: float      # mm
    distortion_max: float    # %
    telecentric: bool
    notes: str = ""


class SystemRecommendationOut(BaseModel):
    camera: CameraOut
    lens: LensOut
    computed: dict[str, float]     # calculated parameters for this combination
    score: float                   # higher is better
    reasons: list[str]
    warnings: list[str]
