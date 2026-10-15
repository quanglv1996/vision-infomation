"""Admin-only account management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import AdminUserCreateIn, AdminUserOut, AdminUserUpdateIn, MessageOut
from app.services import user_service

router = APIRouter(prefix="/admin/users", tags=["Admin"])


@router.get("", response_model=list[AdminUserOut])
def list_users(
    q: str = Query("", max_length=100),
    status: str = Query("all", pattern="^(" + "|".join(user_service.STATUSES) + ")$"),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[AdminUserOut]:
    return user_service.list_users(db, q, status)


@router.post("", response_model=AdminUserOut, status_code=201)
def create_user(body: AdminUserCreateIn, _: User = Depends(require_admin), db: Session = Depends(get_db)) -> AdminUserOut:
    return user_service.create_user(db, body)


@router.patch("/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: int, body: AdminUserUpdateIn, admin: User = Depends(require_admin), db: Session = Depends(get_db),
) -> AdminUserOut:
    return user_service.update_user(db, admin, user_id, body)


@router.delete("/{user_id}", status_code=204, response_class=Response, response_model=None)
def delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)) -> None:
    user_service.delete_user(db, admin, user_id)


@router.post("/{user_id}/send-verification", response_model=MessageOut)
def send_verification(user_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)) -> MessageOut:
    sent = user_service.resend_verification(db, user_id)
    if sent is None:
        return MessageOut(message="Email của tài khoản này đã được xác nhận.", email_sent=False)
    return MessageOut(message="Đã gửi lại email xác nhận." if sent else "Không gửi được email.", email_sent=sent)
