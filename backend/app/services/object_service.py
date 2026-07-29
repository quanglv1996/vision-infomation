"""Object service — business logic layer."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from app.models.object import InspectionObject, ObjectCreate, ObjectUpdate
from app.storage.object_storage import ObjectStorage


class ObjectService:
    def __init__(self) -> None:
        self._storage = ObjectStorage()

    def list(self, search: Optional[str] = None) -> List[InspectionObject]:
        if search:
            return self._storage.search_objects(search)
        return self._storage.get_all()

    def get(self, object_id: str) -> Optional[InspectionObject]:
        return self._storage.get_by_id(object_id)

    def create(self, payload: ObjectCreate) -> InspectionObject:
        obj = InspectionObject(**payload.model_dump())
        return self._storage.create(obj)

    def update(self, object_id: str, payload: ObjectUpdate) -> Optional[InspectionObject]:
        existing = self._storage.get_by_id(object_id)
        if not existing:
            return None
        updated_data = existing.model_dump()
        updated_data.update(payload.model_dump(exclude_none=True))
        updated_data["updated_at"] = datetime.now()
        updated = InspectionObject.model_validate(updated_data)
        return self._storage.update(object_id, updated)

    def delete(self, object_id: str) -> bool:
        return self._storage.delete(object_id)

    def count(self) -> int:
        return self._storage.count()
