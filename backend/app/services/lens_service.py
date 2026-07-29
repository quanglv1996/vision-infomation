"""Lens service — business logic layer."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from app.models.lens import Lens, LensCreate, LensUpdate
from app.storage.lens_storage import LensStorage


class LensService:
    def __init__(self) -> None:
        self._storage = LensStorage()

    def list(self, search: Optional[str] = None) -> List[Lens]:
        if search:
            return self._storage.search_lenses(search)
        return self._storage.get_all()

    def get(self, lens_id: str) -> Optional[Lens]:
        return self._storage.get_by_id(lens_id)

    def create(self, payload: LensCreate) -> Lens:
        lens = Lens(**payload.model_dump())
        return self._storage.create(lens)

    def update(self, lens_id: str, payload: LensUpdate) -> Optional[Lens]:
        existing = self._storage.get_by_id(lens_id)
        if not existing:
            return None
        updated_data = existing.model_dump()
        updated_data.update(payload.model_dump(exclude_none=True))
        updated_data["updated_at"] = datetime.now()
        updated = Lens.model_validate(updated_data)
        return self._storage.update(lens_id, updated)

    def delete(self, lens_id: str) -> bool:
        return self._storage.delete(lens_id)

    def count(self) -> int:
        return self._storage.count()
