"""Password hashing and signed tokens (JWT, HS256).

Token kinds (``typ`` claim):
- ``access`` — API bearer token; carries ``tv`` (the user's token_version) so a
  password change, reset or account lock invalidates every issued token.
- ``verify`` — email confirmation link; carries the email it was sent to.
- ``reset``  — password reset link; carries ``tv``, so it is single-use.
"""
from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt
import jwt

from app.core.config import get_settings

logger = logging.getLogger("mvCalc.security")

_ALGORITHM = "HS256"
_secret: Optional[str] = None


def _key() -> str:
    global _secret
    if _secret is None:
        _secret = get_settings().secret_key
        if not _secret:
            _secret = secrets.token_urlsafe(48)
            logger.warning("MVC_SECRET_KEY is not set — using a random key; tokens expire on restart")
    return _secret


def _pw_bytes(password: str) -> bytes:
    # bcrypt only uses the first 72 bytes (and newer versions reject longer input).
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_pw_bytes(password), bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_pw_bytes(password), password_hash.encode("ascii"))
    except ValueError:
        return False


def create_token(kind: str, subject: int, lifetime: timedelta, **claims: Any) -> str:
    now = datetime.now(timezone.utc)
    payload = {"typ": kind, "sub": str(subject), "iat": now, "exp": now + lifetime, **claims}
    return jwt.encode(payload, _key(), algorithm=_ALGORITHM)


def decode_token(token: str, kind: str) -> Optional[dict]:
    """Claims of a valid, unexpired token of *kind*; None otherwise."""
    try:
        claims = jwt.decode(token, _key(), algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        return None
    if claims.get("typ") != kind:
        return None
    try:
        claims["sub"] = int(claims["sub"])
    except (KeyError, TypeError, ValueError):
        return None
    return claims
