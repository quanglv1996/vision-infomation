"""Test settings — applied before the app is imported.

Tests run on an in-memory SQLite database. To run them against PostgreSQL,
set ``MVC_TEST_DATABASE_URL`` (its tables are dropped first).
"""
import os

os.environ["MVC_DATABASE_URL"] = os.environ.get("MVC_TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ["MVC_SMTP_HOST"] = ""              # emails go to app.core.mailer.OUTBOX
os.environ["MVC_SECRET_KEY"] = "test-secret-key-0123456789abcdef"
os.environ["MVC_ADMIN_EMAIL"] = "admin@test.local"
os.environ["MVC_ADMIN_PASSWORD"] = "admin-pass-123"

import pytest  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _fresh_database():
    from app.db import session
    from app.db.models import Base

    Base.metadata.drop_all(session.engine)
    session._ready = False
    yield
