"""SQLAlchemy ORM models (PostgreSQL in production, SQLite in tests)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

JsonType = JSON().with_variant(JSONB(), "postgresql")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16), default="user")          # "admin" | "user"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    # Bumped on password change / reset / lock — invalidates issued tokens.
    token_version: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    configs: Mapped[list["SavedConfig"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan", passive_deletes=True,
    )

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


class SavedConfig(Base):
    """A saved calculator setup: the inputs plus a snapshot of the results."""

    __tablename__ = "configurations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    # Guided scenario id ("static", "dynamic", …); None for the free-form calculator.
    scenario_id: Mapped[Optional[str]] = mapped_column(String(40), nullable=True, index=True)
    mode: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    values: Mapped[dict] = mapped_column(JsonType, default=dict)
    targets: Mapped[list] = mapped_column(JsonType, default=list)
    results: Mapped[dict] = mapped_column(JsonType, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    owner: Mapped[User] = relationship(back_populates="configs")
