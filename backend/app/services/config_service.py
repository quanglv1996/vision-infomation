"""Saved calculator configurations, scoped to their owner."""
from __future__ import annotations

import math
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError, not_found
from app.db.models import SavedConfig, User, utcnow
from app.schemas.config import ConfigIn, ConfigUpdateIn
from calculation.engine import engine


def _snapshot(values: dict[str, float], targets: list[str]) -> dict[str, float]:
    """Everything the engine derives from *values* — shown in the config list."""
    result = engine.calculate(values, targets)
    return {k: float(v) for k, v in result.all_values.items() if isinstance(v, (int, float)) and math.isfinite(v)}


def _get(db: Session, owner: User, config_id: int) -> SavedConfig:
    cfg = db.get(SavedConfig, config_id)
    if cfg is None or cfg.owner_id != owner.id:
        raise not_found("Không tìm thấy cấu hình.")
    return cfg


def _check_quota(db: Session, owner: User) -> None:
    limit = get_settings().max_configs_per_user
    count = db.scalar(select(func.count(SavedConfig.id)).where(SavedConfig.owner_id == owner.id)) or 0
    if count >= limit:
        raise AppError(400, f"Đã đạt giới hạn {limit} cấu hình. Xóa bớt cấu hình cũ để lưu thêm.", "quota")


def list_configs(db: Session, owner: User, q: str = "", scenario_id: Optional[str] = None) -> list[SavedConfig]:
    stmt = select(SavedConfig).where(SavedConfig.owner_id == owner.id)
    if q.strip():
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(func.lower(SavedConfig.name).like(like), func.lower(SavedConfig.description).like(like)))
    if scenario_id == "free":
        stmt = stmt.where(SavedConfig.scenario_id.is_(None))
    elif scenario_id:
        stmt = stmt.where(SavedConfig.scenario_id == scenario_id)
    return list(db.scalars(stmt.order_by(SavedConfig.updated_at.desc(), SavedConfig.id.desc())))


def get_config(db: Session, owner: User, config_id: int) -> SavedConfig:
    return _get(db, owner, config_id)


def create_config(db: Session, owner: User, body: ConfigIn) -> SavedConfig:
    _check_quota(db, owner)
    cfg = SavedConfig(
        owner_id=owner.id,
        name=body.name.strip(),
        description=body.description.strip(),
        scenario_id=body.scenario_id,
        mode=body.mode,
        values=body.values,
        targets=body.targets,
        results=_snapshot(body.values, body.targets),
    )
    db.add(cfg)
    db.commit()
    return cfg


def update_config(db: Session, owner: User, config_id: int, body: ConfigUpdateIn) -> SavedConfig:
    cfg = _get(db, owner, config_id)
    fields = body.model_fields_set
    if "name" in fields and body.name is not None:
        cfg.name = body.name.strip()
    if "description" in fields and body.description is not None:
        cfg.description = body.description.strip()
    # None is meaningful here: it moves the config to the free-form calculator.
    if "scenario_id" in fields:
        cfg.scenario_id = body.scenario_id
    if "mode" in fields:
        cfg.mode = body.mode
    if "values" in fields and body.values is not None:
        cfg.values = body.values
    if "targets" in fields and body.targets is not None:
        cfg.targets = body.targets
    if fields & {"values", "targets"}:
        cfg.results = _snapshot(cfg.values, cfg.targets)
    cfg.updated_at = utcnow()
    db.commit()
    return cfg


def duplicate_config(db: Session, owner: User, config_id: int) -> SavedConfig:
    src = _get(db, owner, config_id)
    _check_quota(db, owner)
    copy = SavedConfig(
        owner_id=owner.id,
        name=f"{src.name} (bản sao)"[:120],
        description=src.description,
        scenario_id=src.scenario_id,
        mode=src.mode,
        values=dict(src.values),
        targets=list(src.targets),
        results=dict(src.results),
    )
    db.add(copy)
    db.commit()
    return copy


def delete_config(db: Session, owner: User, config_id: int) -> None:
    db.delete(_get(db, owner, config_id))
    db.commit()
