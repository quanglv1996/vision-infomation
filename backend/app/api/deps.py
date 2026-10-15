"""Helpers shared by API endpoints: upload decoding and service error mapping."""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator, Optional

import numpy as np
from fastapi import HTTPException, UploadFile

from app.core.imaging import decode_image


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
