"""Abstract base for all Machine Vision calculators."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class CalculatorResult:
    """Chuẩn hoá output của mọi calculator."""

    def __init__(
        self,
        status: str,
        value: Optional[Any] = None,
        unit: str = "",
        description: str = "",
        missing: Optional[List[str]] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        self.status = status          # "success" | "insufficient_data" | "error"
        self.value = value
        self.unit = unit
        self.description = description
        self.missing = missing or []
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "value": self.value,
            "unit": self.unit,
            "description": self.description,
            "missing": self.missing,
            "details": self.details,
        }

    @classmethod
    def success(
        cls,
        value: Any,
        unit: str = "",
        description: str = "",
        details: Optional[Dict[str, Any]] = None,
    ) -> "CalculatorResult":
        return cls(status="success", value=value, unit=unit, description=description, details=details)

    @classmethod
    def insufficient_data(cls, missing: List[str]) -> "CalculatorResult":
        return cls(status="insufficient_data", missing=missing)

    @classmethod
    def error(cls, message: str) -> "CalculatorResult":
        return cls(status="error", description=message)


class BaseCalculator(ABC):
    """Mọi calculator kế thừa class này."""

    name: str = ""
    description: str = ""
    required_parameters: List[str] = []

    def _check_params(self, params: Dict[str, Any]) -> List[str]:
        return [p for p in self.required_parameters if params.get(p) is None]

    def calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        missing = self._check_params(params)
        if missing:
            return CalculatorResult.insufficient_data(missing)
        try:
            return self._calculate(params)
        except ZeroDivisionError:
            return CalculatorResult.error("Chia cho 0 trong phép tính.")
        except Exception as exc:  # noqa: BLE001
            return CalculatorResult.error(f"Lỗi tính toán: {exc}")

    @abstractmethod
    def _calculate(self, params: Dict[str, Any]) -> CalculatorResult:
        ...
