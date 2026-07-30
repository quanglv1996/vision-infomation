"""Calculation endpoint — the primary API surface."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.calculation import (
    AnalyzeRequest,
    AnalyzeResponse,
    CalculateRequest,
    CalculationResponse,
)
from app.services.calculation_service import (
    run_calculation,
    run_analyze,
)

router = APIRouter(prefix="/calculate", tags=["Calculation"])


@router.post("", response_model=CalculationResponse, summary="Run full parameter inference")
def calculate(body: CalculateRequest) -> CalculationResponse:
    """
    Accepts known parameter values and optional target IDs.
    Returns all computable parameters, the formula used for each,
    missing inputs, and any warnings.
    """
    return run_calculation(body)


@router.post("/analyze", response_model=AnalyzeResponse, summary="Analyse reachability without calculating")
def analyze(body: AnalyzeRequest) -> AnalyzeResponse:
    """
    Returns which parameters are computable from the supplied known values,
    what is missing for each target, and the dependency graph for visualisation.
    """
    return run_analyze(body)
