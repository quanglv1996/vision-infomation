"""Parameter and formula metadata endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.parameter import FormulaOut, ParameterGroupOut, ParameterOut
from knowledge.formulas import FORMULA_BY_ID, FORMULAS
from knowledge.parameters import PARAMETERS, ParameterCategory

router = APIRouter(tags=["Metadata"])


@router.get("/parameters", response_model=list[ParameterGroupOut])
def list_parameters() -> list[ParameterGroupOut]:
    """Return all parameter definitions grouped by category."""
    groups: dict[str, list[ParameterOut]] = {}
    for pid, param in PARAMETERS.items():
        cat = param.category.value
        groups.setdefault(cat, []).append(
            ParameterOut(
                id=param.id,
                name=param.name,
                category=cat,
                unit=param.unit,
                description=param.description,
                min_value=param.min_value,
                max_value=param.max_value,
                typical_range=param.typical_range,
                tags=list(param.tags),
                is_derived=param.is_derived,
            )
        )
    return [ParameterGroupOut(category=cat, parameters=params) for cat, params in groups.items()]


@router.get("/parameters/{param_id}", response_model=ParameterOut)
def get_parameter(param_id: str) -> ParameterOut:
    param = PARAMETERS.get(param_id)
    if not param:
        raise HTTPException(status_code=404, detail=f"Parameter '{param_id}' not found")
    return ParameterOut(
        id=param.id,
        name=param.name,
        category=param.category.value,
        unit=param.unit,
        description=param.description,
        min_value=param.min_value,
        max_value=param.max_value,
        typical_range=param.typical_range,
        tags=list(param.tags),
        is_derived=param.is_derived,
    )


@router.get("/formulas", response_model=list[FormulaOut])
def list_formulas() -> list[FormulaOut]:
    """Return all formula definitions."""
    return [
        FormulaOut(
            id=f.id,
            name=f.name,
            description=f.description,
            inputs=f.inputs,
            output=f.output,
            expression=f.expression,
            category=f.category,
            notes=f.notes,
            inverse_expressions=f.inverse_expressions,
            priority=f.priority,
        )
        for f in FORMULAS
    ]


@router.get("/formulas/{formula_id}", response_model=FormulaOut)
def get_formula(formula_id: str) -> FormulaOut:
    formula = FORMULA_BY_ID.get(formula_id)
    if not formula:
        raise HTTPException(status_code=404, detail=f"Formula '{formula_id}' not found")
    return FormulaOut(
        id=formula.id,
        name=formula.name,
        description=formula.description,
        inputs=formula.inputs,
        output=formula.output,
        expression=formula.expression,
        category=formula.category,
        notes=formula.notes,
        inverse_expressions=formula.inverse_expressions,
        priority=formula.priority,
    )
