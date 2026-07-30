"""
Core Calculation Engine — forward and inverse chaining over the formula graph.

Design principles:
  - No hard-coded if/else logic.
  - All relationships come from the formula library.
  - Forward chaining: given known values, infer everything derivable.
  - Inverse chaining: given output + other inputs, solve for a missing input.
  - Conflict detection: two formulas producing the same parameter are compared.
"""
from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from typing import Optional

from knowledge.formulas import FORMULAS, FORMULAS_BY_OUTPUT, Formula
from knowledge.parameters import PARAMETERS

logger = logging.getLogger(__name__)

_CONFLICT_THRESHOLD = 0.01  # 1 % relative difference triggers a conflict warning


@dataclass
class CalculationStep:
    parameter_id: str
    value: float
    status: str                      # "input" | "calculated" | "inverse"
    formula_id: Optional[str] = None
    formula_name: Optional[str] = None
    expression: Optional[str] = None
    input_values: dict[str, float] = field(default_factory=dict)


@dataclass
class Warning:
    kind: str           # "conflict" | "out_of_range" | "physical" | "performance"
    parameter_id: str
    message: str
    severity: str = "warn"  # "info" | "warn" | "error"


@dataclass
class CalculationResult:
    steps: dict[str, CalculationStep]         # all known / calculated parameters
    all_values: dict[str, float]
    missing_for_targets: dict[str, list[str]] # {target_id: [missing_param_ids]}
    warnings: list[Warning]


class CalculationEngine:
    def __init__(self) -> None:
        self._formulas = FORMULAS

    # ── Public API ────────────────────────────────────────────────────────────

    def calculate(
        self,
        known: dict[str, float],
        targets: Optional[list[str]] = None,
    ) -> CalculationResult:
        """
        Run the full inference cycle.

        1. Forward chain  — apply formulas whose inputs are all known.
        2. Inverse chain  — when an output is known but one input is missing,
                            solve for that input.
        3. Repeat until stable.
        4. If *targets* are supplied, report which inputs are still missing.
        """
        values: dict[str, float] = dict(known)
        steps: dict[str, CalculationStep] = {}
        warnings: list[Warning] = []

        # Seed steps for directly provided values
        for pid, val in known.items():
            steps[pid] = CalculationStep(
                parameter_id=pid,
                value=val,
                status="input",
            )

        changed = True
        iterations = 0
        while changed and iterations < 50:
            iterations += 1
            changed = False

            # — Forward pass —
            for formula in self._formulas:
                if formula.output in values:
                    continue
                if formula.can_calculate(set(values)):
                    result = self._safe_eval(formula, values)
                    if result is not None:
                        values[formula.output] = result
                        steps[formula.output] = CalculationStep(
                            parameter_id=formula.output,
                            value=result,
                            status="calculated",
                            formula_id=formula.id,
                            formula_name=formula.name,
                            expression=formula.expression,
                            input_values={k: values[k] for k in formula.inputs},
                        )
                        changed = True

            # — Inverse pass —
            for formula in self._formulas:
                for inp in formula.inputs:
                    if inp in values:
                        continue
                    if formula.can_invert_for(inp, set(values)):
                        result = self._safe_eval_inverse(formula, inp, values)
                        if result is not None:
                            values[inp] = result
                            steps[inp] = CalculationStep(
                                parameter_id=inp,
                                value=result,
                                status="inverse",
                                formula_id=formula.id + ":inverse",
                                formula_name=f"{formula.name} (solved)",
                                expression=formula.inverse_expressions.get(inp, ""),
                                input_values={
                                    k: values[k]
                                    for k in (set(formula.inputs) | {formula.output}) - {inp}
                                    if k in values
                                },
                            )
                            changed = True

        # — Conflict detection: re-evaluate already-known params from alternative formulas —
        self._detect_conflicts(values, steps, warnings)

        # — Range / physics warnings —
        self._range_warnings(values, warnings)

        # — Missing parameter analysis —
        missing_map: dict[str, list[str]] = {}
        if targets:
            for t in targets:
                if t not in values:
                    missing = self._find_missing(t, set(values), set())
                    missing_map[t] = missing

        return CalculationResult(
            steps=steps,
            all_values=values,
            missing_for_targets=missing_map,
            warnings=warnings,
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _safe_eval(formula: Formula, values: dict[str, float]) -> Optional[float]:
        try:
            val = formula.evaluate(values)
            if math.isfinite(val) and val >= 0 or formula.output in ("distortion",):
                return val
        except Exception as exc:
            logger.debug("Formula %s failed: %s", formula.id, exc)
        return None

    @staticmethod
    def _safe_eval_inverse(
        formula: Formula, solve_for: str, values: dict[str, float]
    ) -> Optional[float]:
        try:
            val = formula.evaluate_inverse(solve_for, values)
            if math.isfinite(val) and val > 0:
                return val
        except Exception as exc:
            logger.debug("Inverse %s→%s failed: %s", formula.id, solve_for, exc)
        return None

    def _detect_conflicts(
        self,
        values: dict[str, float],
        steps: dict[str, CalculationStep],
        warnings: list[Warning],
    ) -> None:
        for output, formulas in FORMULAS_BY_OUTPUT.items():
            if output not in values or len(formulas) < 2:
                continue
            primary = values[output]
            for formula in formulas[1:]:
                if formula.can_calculate(set(values)):
                    alt = self._safe_eval(formula, values)
                    if alt is None:
                        continue
                    if primary != 0 and abs(alt - primary) / abs(primary) > _CONFLICT_THRESHOLD:
                        warnings.append(Warning(
                            kind="conflict",
                            parameter_id=output,
                            message=(
                                f"Conflicting values for '{output}': "
                                f"{primary:.6g} (from {steps[output].formula_id}) vs "
                                f"{alt:.6g} (from {formula.id}). "
                                "Check that your inputs are consistent."
                            ),
                            severity="warn",
                        ))

    def _range_warnings(
        self, values: dict[str, float], warnings: list[Warning]
    ) -> None:
        for pid, val in values.items():
            param = PARAMETERS.get(pid)
            if param is None:
                continue
            if param.min_value is not None and val < param.min_value:
                warnings.append(Warning(
                    kind="out_of_range",
                    parameter_id=pid,
                    message=f"'{param.name}' = {val:.6g} is below minimum {param.min_value}",
                    severity="warn",
                ))
            if param.max_value is not None and val > param.max_value:
                warnings.append(Warning(
                    kind="out_of_range",
                    parameter_id=pid,
                    message=f"'{param.name}' = {val:.6g} exceeds maximum {param.max_value}",
                    severity="warn",
                ))
        # Performance-specific warnings
        blur = values.get("blur_pixels")
        if blur is not None and blur > 1.0:
            warnings.append(Warning(
                kind="performance",
                parameter_id="blur_pixels",
                message=f"Motion blur of {blur:.2f} px exceeds 1 px — image will be blurred.",
                severity="warn",
            ))
        ppf = values.get("pixels_per_feature")
        if ppf is not None and ppf < 3.0:
            warnings.append(Warning(
                kind="performance",
                parameter_id="pixels_per_feature",
                message=f"Only {ppf:.2f} px per feature — below 3 px Nyquist minimum.",
                severity="error",
            ))

    def _find_missing(
        self, target: str, known: set[str], visited: set[str]
    ) -> list[str]:
        """
        Return the minimal set of directly-required (non-computable) parameters
        needed to eventually compute *target*.
        """
        if target in known:
            return []
        if target in visited:
            return [target]  # cycle guard

        visited = visited | {target}
        formulas = FORMULAS_BY_OUTPUT.get(target, [])

        if not formulas:
            return [target]  # no formula → must be provided directly

        best: Optional[list[str]] = None
        for formula in formulas:
            path_missing: list[str] = []
            for inp in formula.inputs:
                if inp not in known:
                    path_missing.extend(self._find_missing(inp, known, visited))
            if not path_missing:
                return []  # this formula path is fully satisfied
            if best is None or len(path_missing) < len(best):
                best = path_missing

        return best or [target]


# Module-level singleton
engine = CalculationEngine()
