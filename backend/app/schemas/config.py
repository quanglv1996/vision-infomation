"""Saved calculator configuration schemas."""
from __future__ import annotations

import math
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from knowledge.parameters import PARAMETERS

_SLUG = r"^[a-z0-9_-]{1,40}$"


def _check_values(v: Optional[dict[str, float]]) -> Optional[dict[str, float]]:
    if v is None:
        return v
    unknown = sorted(k for k in v if k not in PARAMETERS)
    if unknown:
        raise ValueError(f"Unknown parameters: {', '.join(unknown)}")
    if any(not math.isfinite(x) for x in v.values()):
        raise ValueError("Values must be finite numbers")
    return v


def _check_targets(v: Optional[list[str]]) -> Optional[list[str]]:
    if v is None:
        return v
    unknown = sorted(t for t in v if t not in PARAMETERS)
    if unknown:
        raise ValueError(f"Unknown parameters: {', '.join(unknown)}")
    return list(dict.fromkeys(v))


class ConfigIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)
    scenario_id: Optional[str] = Field(default=None, pattern=_SLUG)
    mode: Optional[str] = Field(default=None, pattern=_SLUG)
    values: dict[str, float] = Field(max_length=200)
    targets: list[str] = Field(default=[], max_length=200)

    _values = field_validator("values")(_check_values)
    _targets = field_validator("targets")(_check_targets)


class ConfigUpdateIn(BaseModel):
    """Partial update; omitted fields keep their value."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)
    scenario_id: Optional[str] = Field(default=None, pattern=_SLUG)
    mode: Optional[str] = Field(default=None, pattern=_SLUG)
    values: Optional[dict[str, float]] = Field(default=None, max_length=200)
    targets: Optional[list[str]] = Field(default=None, max_length=200)

    _values = field_validator("values")(_check_values)
    _targets = field_validator("targets")(_check_targets)


class ConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    scenario_id: Optional[str]
    mode: Optional[str]
    values: dict[str, float]
    targets: list[str]
    # Every value the engine derived from `values` when the config was saved.
    results: dict[str, float]
    created_at: datetime
    updated_at: datetime
