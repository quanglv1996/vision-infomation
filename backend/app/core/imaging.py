"""Image helpers shared by every image-analysis service.

All services receive images as OpenCV arrays (BGR / BGRA / grayscale,
uint8 or uint16) exactly as returned by ``cv2.imdecode(..., IMREAD_UNCHANGED)``.
"""
from __future__ import annotations

from typing import Optional

import cv2
import numpy as np


def decode_image(data: bytes) -> Optional[np.ndarray]:
    """Decode encoded image bytes, preserving bit depth and channels. None if undecodable."""
    arr = np.frombuffer(data, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)


def to_gray(img: np.ndarray) -> np.ndarray:
    if img.ndim == 3 and img.shape[2] == 4:
        return cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    if img.ndim == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def bit_depth(img: np.ndarray) -> int:
    if img.dtype == np.uint16:
        return 16
    if img.dtype == np.uint32:
        return 32
    return 8


def safe_kernel(size: int, h: int, w: int) -> int:
    """Return an odd kernel size no larger than the image dimensions."""
    k = min(size, h, w)
    return k if k % 2 == 1 else max(1, k - 1)


def downsample(data: np.ndarray, max_side: int = 64) -> tuple[list[list[float]], int, int]:
    """Shrink a 2-D map so its longest side is ≤ *max_side*; return (nested list, rows, cols)."""
    data = data.astype(np.float32)
    h, w = data.shape
    if max(h, w) > max_side:
        scale = max_side / max(h, w)
        nw = max(1, int(w * scale))
        nh = max(1, int(h * scale))
        data = cv2.resize(data, (nw, nh), interpolation=cv2.INTER_AREA)
    return [[float(v) for v in row] for row in data.tolist()], int(data.shape[0]), int(data.shape[1])
