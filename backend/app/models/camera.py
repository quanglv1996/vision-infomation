from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CameraBase(BaseModel):
    # ── Thông tin ─────────────────────────────────────────────────────────
    name: str = Field(..., min_length=1, max_length=200, description="Tên camera")
    manufacturer: Optional[str] = Field(None, description="Nhà sản xuất")
    model: Optional[str] = Field(None, description="Model / Part number")

    # ── Sensor ────────────────────────────────────────────────────────────
    resolution_width: Optional[int] = Field(None, gt=0, description="Chiều rộng (pixels)")
    resolution_height: Optional[int] = Field(None, gt=0, description="Chiều cao (pixels)")
    pixel_size: Optional[float] = Field(None, gt=0, description="Kích thước pixel (µm)")
    sensor_width: Optional[float] = Field(None, gt=0, description="Chiều rộng sensor (mm)")
    sensor_height: Optional[float] = Field(None, gt=0, description="Chiều cao sensor (mm)")
    sensor_format: Optional[str] = Field(None, description='Kích cỡ sensor, ví dụ "1/2.9 inch"')

    # ── Capture ───────────────────────────────────────────────────────────
    fps: Optional[float] = Field(None, gt=0, description="Frame rate tối đa (fps)")
    exposure_time_min: Optional[float] = Field(None, gt=0, description="Exposure time tối thiểu (µs)")
    exposure_time_max: Optional[float] = Field(None, gt=0, description="Exposure time tối đa (µs)")
    shutter_type: Optional[str] = Field(None, description="Global hoặc Rolling")
    dynamic_range: Optional[float] = Field(None, gt=0, description="Dynamic range (dB)")
    bit_depth: Optional[int] = Field(None, gt=0, le=32, description="Bit depth (bits)")
    quantum_efficiency: Optional[float] = Field(None, ge=0, le=100, description="Quantum efficiency (%)")
    read_noise: Optional[float] = Field(None, gt=0, description="Read noise (e-)")
    full_well_capacity: Optional[float] = Field(None, gt=0, description="Full well capacity (e-)")
    snr_max: Optional[float] = Field(None, gt=0, description="SNR tối đa (dB)")

    # ── Khác ──────────────────────────────────────────────────────────────
    interface: Optional[str] = Field(None, description="GigE / USB3 / Camera Link / CoaXPress…")
    color_mode: Optional[str] = Field(None, description="Mono hoặc Color")
    trigger_support: Optional[bool] = Field(None, description="Hỗ trợ hardware trigger")
    notes: Optional[str] = Field(None, description="Ghi chú thêm")


class CameraCreate(CameraBase):
    """Payload khi tạo camera mới."""


class CameraUpdate(BaseModel):
    """Payload khi cập nhật camera – tất cả field là Optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    resolution_width: Optional[int] = Field(None, gt=0)
    resolution_height: Optional[int] = Field(None, gt=0)
    pixel_size: Optional[float] = Field(None, gt=0)
    sensor_width: Optional[float] = Field(None, gt=0)
    sensor_height: Optional[float] = Field(None, gt=0)
    sensor_format: Optional[str] = None
    fps: Optional[float] = Field(None, gt=0)
    exposure_time_min: Optional[float] = Field(None, gt=0)
    exposure_time_max: Optional[float] = Field(None, gt=0)
    shutter_type: Optional[str] = None
    dynamic_range: Optional[float] = Field(None, gt=0)
    bit_depth: Optional[int] = Field(None, gt=0, le=32)
    quantum_efficiency: Optional[float] = Field(None, ge=0, le=100)
    read_noise: Optional[float] = Field(None, gt=0)
    full_well_capacity: Optional[float] = Field(None, gt=0)
    snr_max: Optional[float] = Field(None, gt=0)
    interface: Optional[str] = None
    color_mode: Optional[str] = None
    trigger_support: Optional[bool] = None
    notes: Optional[str] = None


class Camera(CameraBase):
    """Camera entity được lưu vào file JSON."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    model_config = {"from_attributes": True}
