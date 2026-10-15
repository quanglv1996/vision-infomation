"""Domain error raised by services and rendered by the handler in ``main.py``.

Response body: ``{"detail": "<message>"}``, or
``{"detail": {"code": "<code>", "message": "<message>"}}`` when a machine-readable
code is given (the frontend branches on it, e.g. ``email_not_verified``).
"""
from __future__ import annotations

from typing import Optional


class AppError(Exception):
    def __init__(self, status_code: int, message: str, code: Optional[str] = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.code = code

    @property
    def detail(self) -> object:
        return {"code": self.code, "message": self.message} if self.code else self.message


def not_found(what: str = "Không tìm thấy") -> AppError:
    return AppError(404, what)
