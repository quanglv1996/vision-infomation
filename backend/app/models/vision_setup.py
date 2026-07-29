from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class VisionSetupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    camera_id: str = Field(..., description="ID của camera")
    lens_id: str = Field(..., description="ID của lens")
    object_id: str = Field(..., description="ID của object")

    # ── Thông số setup ────────────────────────────────────────────────────
    working_distance: float = Field(..., gt=0, description="Working distance (mm)")
    lighting_distance: Optional[float] = Field(None, gt=0, description="Khoảng cách chiếu sáng (mm)")
    lighting_angle: Optional[float] = Field(None, ge=0, le=90, description="Góc chiếu sáng (°)")
    lighting_type: Optional[str] = Field(None, description="Ring / Bar / Coaxial / Dome / Backlight…")
    camera_tilt: Optional[float] = Field(None, ge=0, le=90, description="Góc nghiêng camera (°)")
    object_tilt: Optional[float] = Field(None, ge=0, le=90, description="Góc nghiêng vật thể (°)")
    ambient_light: Optional[float] = Field(None, ge=0, description="Ánh sáng môi trường (lux)")
    notes: Optional[str] = Field(None, description="Ghi chú thêm")


class VisionSetupCreate(VisionSetupBase):
    """Payload khi tạo vision setup mới."""


class VisionSetupUpdate(BaseModel):
    """Payload khi cập nhật vision setup – tất cả field là Optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    camera_id: Optional[str] = None
    lens_id: Optional[str] = None
    object_id: Optional[str] = None
    working_distance: Optional[float] = Field(None, gt=0)
    lighting_distance: Optional[float] = Field(None, gt=0)
    lighting_angle: Optional[float] = Field(None, ge=0, le=90)
    lighting_type: Optional[str] = None
    camera_tilt: Optional[float] = Field(None, ge=0, le=90)
    object_tilt: Optional[float] = Field(None, ge=0, le=90)
    ambient_light: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class VisionSetup(VisionSetupBase):
    """VisionSetup entity được lưu vào file JSON."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    results: Optional[Dict[str, Any]] = Field(None, description="Kết quả tính toán gần nhất")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    model_config = {"from_attributes": True}
