"""Project save / load schemas."""
from __future__ import annotations

from pydantic import BaseModel


class ProjectIn(BaseModel):
    name: str
    description: str = ""
    known_values: dict[str, float]
    targets: list[str] = []
    notes: str = ""


class ProjectOut(BaseModel):
    id: str
    name: str
    description: str
    known_values: dict[str, float]
    targets: list[str]
    notes: str
    created_at: str
    updated_at: str


class ProjectSummaryOut(BaseModel):
    id: str
    name: str
    description: str
    parameter_count: int
    created_at: str
    updated_at: str
