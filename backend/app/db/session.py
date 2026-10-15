"""Engine, sessions and schema bootstrap.

Tables are created with ``metadata.create_all`` on first use (no migrations
yet). The calculators work without a database: only the auth / config
endpoints touch it, and they answer 503 while it is unreachable.
"""
from __future__ import annotations

import logging
import threading
import time
from typing import Iterator

from sqlalchemy import create_engine, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.models import Base, User

logger = logging.getLogger("mvCalc.db")


def _make_engine():
    url = get_settings().database_url
    if url.startswith("sqlite"):
        # Tests: one shared in-memory connection across threads.
        return create_engine(url, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    return create_engine(url, pool_pre_ping=True, pool_size=5, max_overflow=10)


engine = _make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

_ready = False
_lock = threading.Lock()


def ensure_schema() -> None:
    """Create tables and the bootstrap admin once per process."""
    global _ready
    if _ready:
        return
    with _lock:
        if _ready:
            return
        Base.metadata.create_all(engine)
        with SessionLocal() as db:
            _bootstrap_admin(db)
        _ready = True


def _bootstrap_admin(db: Session) -> None:
    s = get_settings()
    email = s.admin_email.strip().lower()
    if email and s.admin_password:
        if db.scalar(select(User).where(User.email == email)) is None:
            db.add(User(
                email=email, full_name=s.admin_name, password_hash=hash_password(s.admin_password),
                role="admin", is_active=True, email_verified=True,
            ))
            db.commit()
            logger.info("Created admin account %s", email)
    elif db.scalar(select(User.id).where(User.role == "admin").limit(1)) is None:
        logger.warning("No admin account — set MVC_ADMIN_EMAIL and MVC_ADMIN_PASSWORD to create one")


def init_db(attempts: int = 10, delay: float = 1.5) -> bool:
    """Startup hook: wait for the database (e.g. a container still booting)."""
    for i in range(1, attempts + 1):
        try:
            ensure_schema()
            return True
        except OperationalError as exc:
            logger.warning("Database not reachable (%d/%d): %s", i, attempts, exc.orig)
            time.sleep(delay)
    logger.error("Database unavailable — login and saved configurations are disabled until it is reachable")
    return False


def get_db() -> Iterator[Session]:
    ensure_schema()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
