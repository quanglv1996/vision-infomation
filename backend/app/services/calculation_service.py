"""Service layer — bridges the API and the calculation engine."""
from __future__ import annotations

from app.schemas.calculation import (
    AnalyzeRequest,
    AnalyzeResponse,
    CalculateRequest,
    CalculationResponse,
    CalculationStepOut,
    WarningOut,
)
from calculation.engine import engine
from calculation.validator import validate_inputs
from calculation.graph import graph_to_json, PARAM_GRAPH
from knowledge.parameters import PARAMETERS


def run_calculation(req: CalculateRequest) -> CalculationResponse:
    # Validate inputs first
    validation_errors = validate_inputs(req.known_values)
    ve_out = [{"parameter_id": e.parameter_id, "message": e.message, "severity": e.severity}
              for e in validation_errors
              if e.severity == "error"]  # only hard errors block execution

    result = engine.calculate(req.known_values, req.targets)

    steps_out: dict[str, CalculationStepOut] = {}
    for pid, step in result.steps.items():
        param = PARAMETERS.get(pid)
        steps_out[pid] = CalculationStepOut(
            parameter_id=pid,
            value=step.value,
            status=step.status,
            formula_id=step.formula_id,
            formula_name=step.formula_name,
            expression=step.expression,
            input_values=step.input_values,
            unit=param.unit if param else None,
            parameter_name=param.name if param else pid,
        )

    warnings_out = [
        WarningOut(
            kind=w.kind,
            parameter_id=w.parameter_id,
            message=w.message,
            severity=w.severity,
        )
        for w in result.warnings
    ]

    return CalculationResponse(
        steps=steps_out,
        all_values=result.all_values,
        missing_for_targets=result.missing_for_targets,
        warnings=warnings_out,
        validation_errors=ve_out,
    )


def run_analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    result = engine.calculate(req.known_values, req.targets)

    known_set = set(req.known_values)
    calculated_set = {pid for pid, s in result.steps.items() if s.status != "input"}
    target_set = set(req.targets)

    computable = list(calculated_set)

    graph_data = graph_to_json(PARAM_GRAPH, known_set, calculated_set, target_set)

    return AnalyzeResponse(
        computable=computable,
        missing_for_targets=result.missing_for_targets,
        graph_nodes=graph_data["nodes"],
        graph_edges=graph_data["edges"],
    )
