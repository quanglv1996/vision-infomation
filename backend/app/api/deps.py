"""Helpers shared by API endpoints: upload decoding, service error mapping, auth."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator, Optional

import numpy as np
from fastapi import Depends, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.imaging import decode_image
from app.db.models import User
from app.db.session import get_db
from app.services.auth_service import user_from_access_token


async def read_image(upload: UploadFile) -> np.ndarray:
    """Read and decode one uploaded image; 422 if it is not a decodable image."""
    img = decode_image(await upload.read())
    if img is None:
        raise HTTPException(status_code=422, detail=f"Cannot decode image: {upload.filename or ''}")
    return img


async def read_images(uploads: list[UploadFile]) -> list[np.ndarray]:
    return [await read_image(f) for f in uploads]


async def read_optional_image(upload: Optional[UploadFile]) -> Optional[np.ndarray]:
    return await read_image(upload) if upload else None


@contextmanager
def service_errors(label: str, client_errors: tuple[type[Exception], ...] = ()) -> Iterator[None]:
    """Map exceptions raised by a service call to HTTP errors.

    Exceptions listed in *client_errors* become 422 (bad input); anything else
    becomes 500 with ``"<label>: <message>"``.
    """
    try:
        yield
    except HTTPException:
        raise
    except client_errors as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"{label}: {exc}") from exc


# ── Auth ──────────────────────────────────────────────────────────────────────

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """The signed-in user; 401 without a valid, unrevoked bearer token."""
    user = user_from_access_token(db, creds.credentials) if creds else None
    if user is None:
        raise AppError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.", "not_authenticated")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise AppError(403, "Chỉ quản trị viên mới thực hiện được thao tác này.", "forbidden")
    return user
