"""Camera / lens catalog loaded from ``catalog/*.json`` (cached after first read).

Restart the server after editing the JSON files.
"""
from __future__ import annotations

import json
from functools import lru_cache

from app.core.config import get_settings


def _load(name: str) -> list[dict]:
    with open(get_settings().catalog_dir / name, encoding="utf-8") as f:
        return json.load(f)


@lru_cache
def get_cameras() -> tuple[dict, ...]:
    return tuple(_load("cameras.json"))


@lru_cache
def get_lenses() -> tuple[dict, ...]:
    return tuple(_load("lenses.json"))
