"""Generic JSON file-based storage."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Generic, List, Optional, Type, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)


class BaseStorage(Generic[T]):
    """Đọc/ghi dữ liệu vào một file JSON duy nhất."""

    def __init__(self, file_path: Path, model_class: Type[T]) -> None:
        self.file_path = file_path
        self.model_class = model_class
        self._ensure_file()

    # ── Private helpers ──────────────────────────────────────────────────

    def _ensure_file(self) -> None:
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.file_path.write_text("[]", encoding="utf-8")

    def _load(self) -> List[T]:
        try:
            raw = json.loads(self.file_path.read_text(encoding="utf-8"))
            return [self.model_class.model_validate(item) for item in raw]
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error("Lỗi đọc %s: %s", self.file_path, exc)
            return []

    def _save(self, items: List[T]) -> None:
        data = [item.model_dump(mode="json") for item in items]
        self.file_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False, default=str),
            encoding="utf-8",
        )

    # ── Public CRUD ──────────────────────────────────────────────────────

    def get_all(self) -> List[T]:
        return self._load()

    def get_by_id(self, item_id: str) -> Optional[T]:
        return next((x for x in self._load() if x.id == item_id), None)  # type: ignore[attr-defined]

    def create(self, item: T) -> T:
        items = self._load()
        items.append(item)
        self._save(items)
        return item

    def update(self, item_id: str, updated: T) -> Optional[T]:
        items = self._load()
        for i, item in enumerate(items):
            if item.id == item_id:  # type: ignore[attr-defined]
                items[i] = updated
                self._save(items)
                return updated
        return None

    def delete(self, item_id: str) -> bool:
        items = self._load()
        filtered = [x for x in items if x.id != item_id]  # type: ignore[attr-defined]
        if len(filtered) == len(items):
            return False
        self._save(filtered)
        return True

    def count(self) -> int:
        return len(self._load())

    def search(self, query: str, fields: List[str]) -> List[T]:
        q = query.lower()
        results: List[T] = []
        for item in self._load():
            d = item.model_dump()
            if any(q in str(d.get(f, "")).lower() for f in fields):
                results.append(item)
        return results
