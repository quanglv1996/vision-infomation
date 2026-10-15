"""Admin account management."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.errors import AppError, not_found
from app.core.security import hash_password
from app.db.models import SavedConfig, User
from app.schemas.auth import AdminUserCreateIn, AdminUserOut, AdminUserUpdateIn
from app.services.auth_service import find_user, normalize_email, send_verification_email

STATUSES = ("all", "pending", "active", "disabled", "admin")


def _out(user: User, config_count: int) -> AdminUserOut:
    data = AdminUserOut.model_validate(user)
    data.config_count = config_count
    return data


def _config_count(db: Session, user_id: int) -> int:
    return db.scalar(select(func.count(SavedConfig.id)).where(SavedConfig.owner_id == user_id)) or 0


def _get(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise not_found("Không tìm thấy tài khoản.")
    return user


def _other_active_admins(db: Session, user_id: int) -> int:
    return db.scalar(
        select(func.count(User.id)).where(User.role == "admin", User.is_active.is_(True), User.id != user_id)
    ) or 0


def list_users(db: Session, q: str = "", status: str = "all") -> list[AdminUserOut]:
    counts = (
        select(SavedConfig.owner_id, func.count(SavedConfig.id).label("n"))
        .group_by(SavedConfig.owner_id)
        .subquery()
    )
    stmt = (
        select(User, func.coalesce(counts.c.n, 0))
        .outerjoin(counts, counts.c.owner_id == User.id)
        .order_by(User.created_at.desc(), User.id.desc())
    )
    if q.strip():
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(func.lower(User.email).like(like), func.lower(User.full_name).like(like)))
    if status == "pending":
        stmt = stmt.where(User.email_verified.is_(False))
    elif status == "active":
        stmt = stmt.where(User.is_active.is_(True), User.email_verified.is_(True))
    elif status == "disabled":
        stmt = stmt.where(User.is_active.is_(False))
    elif status == "admin":
        stmt = stmt.where(User.role == "admin")
    return [_out(u, n) for u, n in db.execute(stmt).all()]


def create_user(db: Session, body: AdminUserCreateIn) -> AdminUserOut:
    email = normalize_email(body.email)
    if find_user(db, email) is not None:
        raise AppError(409, "Email này đã được đăng ký.", "email_taken")
    user = User(
        email=email, full_name=body.full_name, password_hash=hash_password(body.password),
        role=body.role, is_active=body.is_active, email_verified=body.email_verified,
    )
    db.add(user)
    db.commit()
    if not user.email_verified and body.send_verification:
        send_verification_email(user)
    return _out(user, 0)


def update_user(db: Session, acting: User, user_id: int, body: AdminUserUpdateIn) -> AdminUserOut:
    user = _get(db, user_id)
    fields = body.model_fields_set

    loses_admin = (
        ("role" in fields and body.role != "admin") or ("is_active" in fields and body.is_active is False)
    ) and user.role == "admin" and user.is_active
    if loses_admin:
        if user.id == acting.id:
            raise AppError(400, "Không thể tự hạ quyền hoặc tự khóa tài khoản quản trị của chính mình.", "self_protect")
        if _other_active_admins(db, user.id) == 0:
            raise AppError(400, "Phải còn ít nhất một quản trị viên đang hoạt động.", "last_admin")

    if "email" in fields and body.email is not None:
        email = normalize_email(body.email)
        other = find_user(db, email)
        if other is not None and other.id != user.id:
            raise AppError(409, "Email này đã được dùng cho tài khoản khác.", "email_taken")
        user.email = email
    if "full_name" in fields and body.full_name is not None:
        user.full_name = body.full_name
    if "role" in fields and body.role is not None:
        user.role = body.role
    if "email_verified" in fields and body.email_verified is not None:
        user.email_verified = body.email_verified
    if "is_active" in fields and body.is_active is not None and body.is_active != user.is_active:
        user.is_active = body.is_active
        if not body.is_active:
            user.token_version += 1          # sign the user out everywhere
    if "password" in fields and body.password is not None:
        user.password_hash = hash_password(body.password)
        user.token_version += 1
    db.commit()
    return _out(user, _config_count(db, user.id))


def delete_user(db: Session, acting: User, user_id: int) -> None:
    user = _get(db, user_id)
    if user.id == acting.id:
        raise AppError(400, "Không thể tự xóa tài khoản của chính mình.", "self_protect")
    if user.role == "admin" and user.is_active and _other_active_admins(db, user.id) == 0:
        raise AppError(400, "Phải còn ít nhất một quản trị viên đang hoạt động.", "last_admin")
    db.delete(user)
    db.commit()


def resend_verification(db: Session, user_id: int) -> Optional[bool]:
    """True/False = sent/failed; None when the address is already confirmed."""
    user = _get(db, user_id)
    if user.email_verified:
        return None
    return send_verification_email(user)
