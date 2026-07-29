"""REST API – Cameras."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.camera import Camera, CameraCreate, CameraUpdate
from app.services.camera_service import CameraService

router = APIRouter(prefix="/api/cameras", tags=["Cameras"])
_svc = CameraService()


@router.get("", response_model=List[Camera])
def list_cameras(search: Optional[str] = Query(None)):
    return _svc.list(search)


@router.get("/{camera_id}", response_model=Camera)
def get_camera(camera_id: str):
    cam = _svc.get(camera_id)
    if not cam:
        raise HTTPException(404, "Camera không tồn tại.")
    return cam


@router.post("", response_model=Camera, status_code=201)
def create_camera(payload: CameraCreate):
    return _svc.create(payload)


@router.put("/{camera_id}", response_model=Camera)
def update_camera(camera_id: str, payload: CameraUpdate):
    cam = _svc.update(camera_id, payload)
    if not cam:
        raise HTTPException(404, "Camera không tồn tại.")
    return cam


@router.delete("/{camera_id}", status_code=204)
def delete_camera(camera_id: str):
    if not _svc.delete(camera_id):
        raise HTTPException(404, "Camera không tồn tại.")
