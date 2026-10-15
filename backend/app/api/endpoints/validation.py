"""Vision Performance Validation API endpoint."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.api.deps import service_errors
from app.schemas.validation import ValidationRequest, ValidationResult
from app.services.validation_service import run_validation

router = APIRouter(prefix="/validation", tags=["validation"])


@router.post("/analyze", response_model=ValidationResult)
async def analyze_validation(req: ValidationRequest):
    # Require at least one module to be populated
    has_data = any([
        req.measurements, req.predictions, req.ocr_predicted,
        req.inference_times_ms, req.stability_results, req.grr,
    ])
    if not has_data:
        raise HTTPException(status_code=400, detail="At least one validation module must have data")

    with service_errors("Validation error"):
        return run_validation(req)
