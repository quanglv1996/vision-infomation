"""Pydantic schemas for calculation requests and responses."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class CalculateRequest(BaseModel):
    """Inputs for a single calculation run."""

    known_values: dict[str, float] = Field(
        description="Known parameter values keyed by parameter ID."
    )
    targets: list[str] = Field(
        default_factory=list,
        description="Optional list of parameter IDs the user wants to compute.",
    )

    model_config = {"json_schema_extra": {
        "example": {
            "known_values": {
                "resolution_x": 2448,
                "resolution_y": 2048,
                "pixel_size": 3.45,
                "focal_length": 50,
                "working_distance": 500,
            },
            "targets": ["mm_per_pixel", "fov_x", "dof"],
        }
    }}


class CalculationStepOut(BaseModel):
    parameter_id: str
    value: float
    status: str          # "input" | "calculated" | "inverse"
    formula_id: Optional[str] = None
    formula_name: Optional[str] = None
    expression: Optional[str] = None
    input_values: dict[str, float] = Field(default_factory=dict)
    unit: Optional[str] = None
    parameter_name: Optional[str] = None


class WarningOut(BaseModel):
    kind: str
    parameter_id: str
    message: str
    severity: str


class MissingAnalysisOut(BaseModel):
    target: str
    missing_parameters: list[str]


class CalculationResponse(BaseModel):
    steps: dict[str, CalculationStepOut]
    all_values: dict[str, float]
    missing_for_targets: dict[str, list[str]]
    warnings: list[WarningOut]
    validation_errors: list[dict[str, Any]] = Field(default_factory=list)


class AnalyzeRequest(BaseModel):
    """Analyse what is possible / missing without running the full engine."""
    known_values: dict[str, float] = Field(default_factory=dict)
    targets: list[str] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    computable: list[str]         # parameters reachable from known_values
    missing_for_targets: dict[str, list[str]]
    graph_nodes: list[dict]
    graph_edges: list[dict]
