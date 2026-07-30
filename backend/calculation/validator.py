"""Input validation and physics-sanity checks."""
from __future__ import annotations

from dataclasses import dataclass
from knowledge.parameters import PARAMETERS


@dataclass
class ValidationError:
    parameter_id: str
    message: str
    severity: str = "error"  # "error" | "warn"


def validate_inputs(known: dict[str, float]) -> list[ValidationError]:
    errors: list[ValidationError] = []

    for pid, val in known.items():
        param = PARAMETERS.get(pid)
        if param is None:
            errors.append(ValidationError(pid, f"Unknown parameter '{pid}'", severity="warn"))
            continue

        if not isinstance(val, (int, float)):
            errors.append(ValidationError(pid, f"Value must be numeric, got {type(val).__name__}"))
            continue

        import math
        if not math.isfinite(val):
            errors.append(ValidationError(pid, "Value must be a finite number"))
            continue

        if param.min_value is not None and val < param.min_value:
            errors.append(ValidationError(
                pid,
                f"'{param.name}' = {val} is below the minimum allowed value {param.min_value}",
            ))

        if param.max_value is not None and val > param.max_value:
            errors.append(ValidationError(
                pid,
                f"'{param.name}' = {val} exceeds the maximum allowed value {param.max_value}",
            ))

    return errors
