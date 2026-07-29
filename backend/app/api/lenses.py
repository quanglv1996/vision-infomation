"""REST API – Lenses."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.lens import Lens, LensCreate, LensUpdate
from app.services.lens_service import LensService

router = APIRouter(prefix="/api/lenses", tags=["Lenses"])
_svc = LensService()


@router.get("", response_model=List[Lens])
def list_lenses(search: Optional[str] = Query(None)):
    return _svc.list(search)


@router.get("/{lens_id}", response_model=Lens)
def get_lens(lens_id: str):
    lens = _svc.get(lens_id)
    if not lens:
        raise HTTPException(404, "Lens không tồn tại.")
    return lens


@router.post("", response_model=Lens, status_code=201)
def create_lens(payload: LensCreate):
    return _svc.create(payload)


@router.put("/{lens_id}", response_model=Lens)
def update_lens(lens_id: str, payload: LensUpdate):
    lens = _svc.update(lens_id, payload)
    if not lens:
        raise HTTPException(404, "Lens không tồn tại.")
    return lens


@router.delete("/{lens_id}", status_code=204)
def delete_lens(lens_id: str):
    if not _svc.delete(lens_id):
        raise HTTPException(404, "Lens không tồn tại.")
