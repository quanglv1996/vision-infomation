"""REST API – Vision Setups."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.vision_setup import VisionSetup, VisionSetupCreate, VisionSetupUpdate
from app.services.vision_setup_service import VisionSetupService

router = APIRouter(prefix="/api/vision-setups", tags=["Vision Setups"])
_svc = VisionSetupService()


@router.get("", response_model=List[VisionSetup])
def list_setups(search: Optional[str] = Query(None)):
    return _svc.list(search)


@router.get("/{setup_id}", response_model=VisionSetup)
def get_setup(setup_id: str):
    setup = _svc.get(setup_id)
    if not setup:
        raise HTTPException(404, "Vision Setup không tồn tại.")
    return setup


@router.post("", response_model=VisionSetup, status_code=201)
def create_setup(payload: VisionSetupCreate):
    return _svc.create(payload)


@router.put("/{setup_id}", response_model=VisionSetup)
def update_setup(setup_id: str, payload: VisionSetupUpdate):
    setup = _svc.update(setup_id, payload)
    if not setup:
        raise HTTPException(404, "Vision Setup không tồn tại.")
    return setup


@router.delete("/{setup_id}", status_code=204)
def delete_setup(setup_id: str):
    if not _svc.delete(setup_id):
        raise HTTPException(404, "Vision Setup không tồn tại.")


@router.post("/{setup_id}/calculate", response_model=Dict[str, Any])
def calculate(setup_id: str):
    """Chạy toàn bộ calculators cho vision setup và trả về kết quả."""
    results = _svc.calculate(setup_id)
    if results is None:
        raise HTTPException(404, "Vision Setup không tồn tại.")
    return results
