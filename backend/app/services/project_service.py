"""In-memory project store (swap with SQLAlchemy for production persistence)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

_store: dict[str, dict] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def save_project(data: dict) -> dict:
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
    _store[pid] = record
    return record


def get_project(project_id: str) -> Optional[dict]:
    return _store.get(project_id)


def list_projects() -> list[dict]:
    return [
        {
            "id": v["id"],
            "name": v["name"],
            "description": v["description"],
            "parameter_count": len(v.get("known_values", {})),
            "created_at": v["created_at"],
            "updated_at": v["updated_at"],
        }
        for v in _store.values()
    ]


def delete_project(project_id: str) -> bool:
    if project_id in _store:
        del _store[project_id]
        return True
    return False
