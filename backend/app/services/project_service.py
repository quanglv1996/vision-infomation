"""Project persistence.

Endpoints depend on the ``ProjectRepository`` protocol via ``get_project_repository``;
to persist projects (SQLite, Postgres, files…) implement the protocol and return
the new class from ``get_project_repository``.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, Protocol


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ProjectRepository(Protocol):
    def save(self, data: dict) -> dict: ...
    def get(self, project_id: str) -> Optional[dict]: ...
    def list(self) -> list[dict]: ...
    def delete(self, project_id: str) -> bool: ...


class InMemoryProjectRepository:
    """Process-local store — data is lost on restart."""

    def __init__(self) -> None:
        self._store: dict[str, dict] = {}

    def save(self, data: dict) -> dict:
        pid = str(uuid.uuid4())
        now = _now()
        record = {
            "id": pid,
            "name": data.get("name", "Untitled"),
            "description": data.get("description", ""),
            "known_values": data.get("known_values", {}),
            "targets": data.get("targets", []),
            "notes": data.get("notes", ""),
            "created_at": now,
            "updated_at": now,
        }
        self._store[pid] = record
        return record

    def get(self, project_id: str) -> Optional[dict]:
        return self._store.get(project_id)

    def list(self) -> list[dict]:
        return [
            {
                "id": v["id"],
                "name": v["name"],
                "description": v["description"],
                "parameter_count": len(v.get("known_values", {})),
                "created_at": v["created_at"],
                "updated_at": v["updated_at"],
            }
            for v in self._store.values()
        ]

    def delete(self, project_id: str) -> bool:
        return self._store.pop(project_id, None) is not None


_repository = InMemoryProjectRepository()


def get_project_repository() -> ProjectRepository:
    return _repository
