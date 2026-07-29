"""REST API – Objects."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.object import InspectionObject, ObjectCreate, ObjectUpdate
from app.services.object_service import ObjectService

router = APIRouter(prefix="/api/objects", tags=["Objects"])
_svc = ObjectService()


@router.get("", response_model=List[InspectionObject])
def list_objects(search: Optional[str] = Query(None)):
    return _svc.list(search)


@router.get("/{object_id}", response_model=InspectionObject)
def get_object(object_id: str):
    obj = _svc.get(object_id)
    if not obj:
        raise HTTPException(404, "Object không tồn tại.")
    return obj


@router.post("", response_model=InspectionObject, status_code=201)
def create_object(payload: ObjectCreate):
    return _svc.create(payload)


@router.put("/{object_id}", response_model=InspectionObject)
def update_object(object_id: str, payload: ObjectUpdate):
    obj = _svc.update(object_id, payload)
    if not obj:
        raise HTTPException(404, "Object không tồn tại.")
    return obj


@router.delete("/{object_id}", status_code=204)
def delete_object(object_id: str):
    if not _svc.delete(object_id):
        raise HTTPException(404, "Object không tồn tại.")
