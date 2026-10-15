"""Saved calculator configurations of the signed-in user."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import SavedConfig, User
from app.db.session import get_db
from app.schemas.config import ConfigIn, ConfigOut, ConfigUpdateIn
from app.services import config_service

router = APIRouter(prefix="/configs", tags=["Configurations"])


@router.get("", response_model=list[ConfigOut])
def list_configs(
    q: str = Query("", max_length=100),
    scenario_id: Optional[str] = Query(None, description='Scenario id, or "free" for the free-form calculator'),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SavedConfig]:
    return config_service.list_configs(db, user, q, scenario_id)


@router.post("", response_model=ConfigOut, status_code=201)
def create_config(body: ConfigIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SavedConfig:
    return config_service.create_config(db, user, body)


@router.get("/{config_id}", response_model=ConfigOut)
def get_config(config_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SavedConfig:
    return config_service.get_config(db, user, config_id)


@router.patch("/{config_id}", response_model=ConfigOut)
def update_config(
    config_id: int, body: ConfigUpdateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db),
) -> SavedConfig:
    return config_service.update_config(db, user, config_id, body)


@router.post("/{config_id}/duplicate", response_model=ConfigOut, status_code=201)
def duplicate_config(config_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SavedConfig:
    return config_service.duplicate_config(db, user, config_id)


@router.delete("/{config_id}", status_code=204, response_class=Response, response_model=None)
def delete_config(config_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    config_service.delete_config(db, user, config_id)
