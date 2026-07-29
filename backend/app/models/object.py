from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ObjectBase(BaseModel):
    # ── Thông tin ─────────────────────────────────────────────────────────
    name: str = Field(..., min_length=1, max_length=200, description="Tên vật thể")

    # ── Kích thước ────────────────────────────────────────────────────────
    width: Optional[float] = Field(None, gt=0, description="Chiều rộng (mm)")
    height: Optional[float] = Field(None, gt=0, description="Chiều cao (mm)")
    thickness: Optional[float] = Field(None, gt=0, description="Độ dày (mm)")

    # ── Motion ────────────────────────────────────────────────────────────
    speed: Optional[float] = Field(None, ge=0, description="Tốc độ di chuyển (mm/s)")
    rotation_speed: Optional[float] = Field(None, ge=0, description="Tốc độ quay (rpm)")
    acceleration: Optional[float] = Field(None, ge=0, description="Gia tốc (mm/s²)")

    # ── Inspection ────────────────────────────────────────────────────────
    min_defect_size: Optional[float] = Field(None, gt=0, description="Kích thước lỗi nhỏ nhất cần phát hiện (mm)")
    max_defect_size: Optional[float] = Field(None, gt=0, description="Kích thước lỗi lớn nhất (mm)")
    required_accuracy: Optional[float] = Field(None, gt=0, description="Độ chính xác yêu cầu (mm)")
    required_repeatability: Optional[float] = Field(None, gt=0, description="Độ lặp lại yêu cầu (mm)")

    # ── Vật liệu ──────────────────────────────────────────────────────────
    reflectivity: Optional[float] = Field(None, ge=0, le=100, description="Độ phản xạ (%)")
    transparency: Optional[float] = Field(None, ge=0, le=100, description="Độ trong suốt (%)")
    color: Optional[str] = Field(None, description="Màu sắc bề mặt")
    notes: Optional[str] = Field(None, description="Ghi chú thêm")


class ObjectCreate(ObjectBase):
    """Payload khi tạo object mới."""


class ObjectUpdate(BaseModel):
    """Payload khi cập nhật object – tất cả field là Optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    width: Optional[float] = Field(None, gt=0)
    height: Optional[float] = Field(None, gt=0)
    thickness: Optional[float] = Field(None, gt=0)
    speed: Optional[float] = Field(None, ge=0)
    rotation_speed: Optional[float] = Field(None, ge=0)
    acceleration: Optional[float] = Field(None, ge=0)
    min_defect_size: Optional[float] = Field(None, gt=0)
    max_defect_size: Optional[float] = Field(None, gt=0)
    required_accuracy: Optional[float] = Field(None, gt=0)
    required_repeatability: Optional[float] = Field(None, gt=0)
    reflectivity: Optional[float] = Field(None, ge=0, le=100)
    transparency: Optional[float] = Field(None, ge=0, le=100)
    color: Optional[str] = None
    notes: Optional[str] = None


class InspectionObject(ObjectBase):
    """Object entity được lưu vào file JSON.
    Đặt tên InspectionObject để tránh xung đột với builtin ``object``."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    model_config = {"from_attributes": True}
