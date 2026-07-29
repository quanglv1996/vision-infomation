from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LensBase(BaseModel):
    # ── Thông tin ─────────────────────────────────────────────────────────
    name: str = Field(..., min_length=1, max_length=200, description="Tên lens")
    manufacturer: Optional[str] = Field(None, description="Nhà sản xuất")
    model: Optional[str] = Field(None, description="Model / Part number")

    # ── Optics ────────────────────────────────────────────────────────────
    focal_length: Optional[float] = Field(None, gt=0, description="Tiêu cự (mm)")
    magnification: Optional[float] = Field(None, description="Độ phóng đại")
    working_distance: Optional[float] = Field(None, gt=0, description="Working distance mặc định (mm)")

    # ── Khẩu ──────────────────────────────────────────────────────────────
    aperture: Optional[float] = Field(None, gt=0, description="F-number (f/#)")

    # ── Optical ───────────────────────────────────────────────────────────
    distortion: Optional[float] = Field(None, description="Distortion (%)")

    # ── MTF ───────────────────────────────────────────────────────────────
    mtf10: Optional[float] = Field(None, gt=0, description="MTF10 (lp/mm)")
    mtf30: Optional[float] = Field(None, gt=0, description="MTF30 (lp/mm)")
    mtf50: Optional[float] = Field(None, gt=0, description="MTF50 (lp/mm)")

    # ── Telecentric ───────────────────────────────────────────────────────
    is_telecentric: bool = Field(False, description="Là telecentric lens?")
    telecentric_angle: Optional[float] = Field(None, ge=0, description="Góc telecentric (mrad)")

    # ── Image Circle ──────────────────────────────────────────────────────
    image_circle: Optional[float] = Field(None, gt=0, description="Image circle (mm)")

    # ── Mount & Focus ─────────────────────────────────────────────────────
    mount: Optional[str] = Field(None, description="C-Mount / F-Mount / M58…")
    focus_type: Optional[str] = Field(None, description="Fixed / Manual / Auto")

    # ── Working Distance range ────────────────────────────────────────────
    min_working_distance: Optional[float] = Field(None, gt=0, description="Working distance nhỏ nhất (mm)")
    max_working_distance: Optional[float] = Field(None, gt=0, description="Working distance lớn nhất (mm)")

    # ── Vật lý ────────────────────────────────────────────────────────────
    weight: Optional[float] = Field(None, gt=0, description="Trọng lượng (g)")
    notes: Optional[str] = Field(None, description="Ghi chú thêm")


class LensCreate(LensBase):
    """Payload khi tạo lens mới."""


class LensUpdate(BaseModel):
    """Payload khi cập nhật lens – tất cả field là Optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    focal_length: Optional[float] = Field(None, gt=0)
    magnification: Optional[float] = None
    working_distance: Optional[float] = Field(None, gt=0)
    aperture: Optional[float] = Field(None, gt=0)
    distortion: Optional[float] = None
    mtf10: Optional[float] = Field(None, gt=0)
    mtf30: Optional[float] = Field(None, gt=0)
    mtf50: Optional[float] = Field(None, gt=0)
    is_telecentric: Optional[bool] = None
    telecentric_angle: Optional[float] = None
    image_circle: Optional[float] = Field(None, gt=0)
    mount: Optional[str] = None
    focus_type: Optional[str] = None
    min_working_distance: Optional[float] = Field(None, gt=0)
    max_working_distance: Optional[float] = Field(None, gt=0)
    weight: Optional[float] = Field(None, gt=0)
    notes: Optional[str] = None


class Lens(LensBase):
    """Lens entity được lưu vào file JSON."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    model_config = {"from_attributes": True}
