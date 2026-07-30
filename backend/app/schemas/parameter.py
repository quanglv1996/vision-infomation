"""Parameter and formula metadata schemas."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ParameterOut(BaseModel):
    id: str
    name: str
    category: str
    unit: str
    description: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    typical_range: Optional[tuple[float, float]] = None
    tags: list[str]
    is_derived: bool


class ParameterGroupOut(BaseModel):
    category: str
    parameters: list[ParameterOut]


class FormulaOut(BaseModel):
    id: str
    name: str
    description: str
    inputs: list[str]
    output: str
    expression: str
    category: str
    notes: str
    inverse_expressions: dict[str, str]
    priority: int
