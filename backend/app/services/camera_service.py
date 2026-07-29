"""Camera service — business logic layer."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from app.models.camera import Camera, CameraCreate, CameraUpdate
from app.storage.camera_storage import CameraStorage


class CameraService:
    def __init__(self) -> None:
        self._storage = CameraStorage()

    def list(self, search: Optional[str] = None) -> List[Camera]:
        if search:
            return self._storage.search_cameras(search)
        return self._storage.get_all()

    def get(self, camera_id: str) -> Optional[Camera]:
        return self._storage.get_by_id(camera_id)

    def create(self, payload: CameraCreate) -> Camera:
        camera = Camera(**payload.model_dump())
        return self._storage.create(camera)

    def update(self, camera_id: str, payload: CameraUpdate) -> Optional[Camera]:
        existing = self._storage.get_by_id(camera_id)
        if not existing:
            return None
        updated_data = existing.model_dump()
        patch = payload.model_dump(exclude_none=True)
        updated_data.update(patch)
        updated_data["updated_at"] = datetime.now()
        updated = Camera.model_validate(updated_data)
        return self._storage.update(camera_id, updated)

    def delete(self, camera_id: str) -> bool:
        return self._storage.delete(camera_id)

    def count(self) -> int:
        return self._storage.count()
