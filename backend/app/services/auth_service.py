"""Registration, email confirmation, login and password reset."""
from __future__ import annotations

import html
import threading
import time
from collections import defaultdict, deque
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.mailer import render, send_email
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.db.models import User, utcnow
from app.schemas.auth import (
    MessageOut,
    ProfileUpdateIn,
    RegisterIn,
    TokenOut,
    UserOut,
)

# ── helpers ───────────────────────────────────────────────────────────────────


def normalize_email(email: str) -> str:
    return email.strip().lower()


def find_user(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def issue_token(user: User) -> TokenOut:
    minutes = get_settings().access_token_minutes
    token = create_token("access", user.id, timedelta(minutes=minutes), tv=user.token_version)
    return TokenOut(access_token=token, expires_in=minutes * 60, user=UserOut.model_validate(user))


def user_from_access_token(db: Session, token: str) -> User | None:
    claims = decode_token(token, "access")
    if not claims:
        return None
    user = db.get(User, claims["sub"])
    if user is None or not user.is_active or claims.get("tv") != user.token_version:
        return None
    return user


# ── login throttle ────────────────────────────────────────────────────────────
# Process-local: at most _MAX_FAILURES wrong passwords per email per window.

_MAX_FAILURES = 8
_WINDOW_S = 15 * 60
_failures: dict[str, deque[float]] = defaultdict(deque)
_fail_lock = threading.Lock()


def _recent_failures(email: str) -> deque[float]:
    q = _failures[email]
    cutoff = time.monotonic() - _WINDOW_S
    while q and q[0] < cutoff:
        q.popleft()
    return q


# ── emails ────────────────────────────────────────────────────────────────────


def send_verification_email(user: User) -> bool:
    s = get_settings()
    token = create_token("verify", user.id, timedelta(hours=s.verify_token_hours), email=user.email)
    link = f"{s.frontend_url.rstrip('/')}/?verify={token}"
    text, body = render(
        title="Xác nhận địa chỉ email",
        intro=f"Xin chào {html.escape(user.full_name or user.email)}, cảm ơn bạn đã đăng ký Vision Studio. "
              "Nhấn nút bên dưới để xác nhận email và kích hoạt tài khoản.",
        button="Xác nhận email",
        link=link,
        outro=f"Liên kết có hiệu lực trong {s.verify_token_hours} giờ. "
              "Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email.",
    )
    return send_email(user.email, "Xác nhận đăng ký Vision Studio", text, body)


def send_reset_email(user: User) -> bool:
    s = get_settings()
    token = create_token("reset", user.id, timedelta(minutes=s.reset_token_minutes), tv=user.token_version)
    link = f"{s.frontend_url.rstrip('/')}/?reset={token}"
    text, body = render(
        title="Đặt lại mật khẩu",
        intro=f"Xin chào {html.escape(user.full_name or user.email)}, có yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
        button="Đặt mật khẩu mới",
        link=link,
        outro=f"Liên kết dùng được một lần trong {s.reset_token_minutes} phút. "
              "Nếu bạn không yêu cầu, hãy bỏ qua email — mật khẩu hiện tại vẫn giữ nguyên.",
    )
    return send_email(user.email, "Đặt lại mật khẩu Vision Studio", text, body)


# ── flows ─────────────────────────────────────────────────────────────────────


def register(db: Session, body: RegisterIn) -> MessageOut:
    email = normalize_email(body.email)
    existing = find_user(db, email)
    if existing is not None:
        if existing.email_verified:
            raise AppError(409, "Email này đã được đăng ký.", "email_taken")
        raise AppError(409, "Email đã đăng ký nhưng chưa xác nhận. Bạn có thể gửi lại email xác nhận.", "email_pending")

    user = User(email=email, full_name=body.full_name, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    sent = send_verification_email(user)
    return MessageOut(
        message=(f"Đã gửi email xác nhận tới {email}. Mở email và nhấn liên kết để kích hoạt tài khoản."
                 if sent else
                 "Tài khoản đã được tạo nhưng không gửi được email xác nhận. Thử gửi lại sau hoặc liên hệ quản trị viên."),
        email_sent=sent,
    )


def resend_verification(db: Session, email: str) -> MessageOut:
    user = find_user(db, email)
    sent = True
    if user is not None and not user.email_verified and user.is_active:
        sent = send_verification_email(user)
    # Same answer whether or not the address exists.
    return MessageOut(
        message="Nếu email tồn tại và chưa được xác nhận, một liên kết xác nhận mới đã được gửi." if sent
        else "Không gửi được email. Thử lại sau hoặc liên hệ quản trị viên.",
        email_sent=sent,
    )


def verify_email(db: Session, token: str) -> TokenOut:
    claims = decode_token(token, "verify")
    user = db.get(User, claims["sub"]) if claims else None
    if user is None or claims.get("email") != user.email:
        raise AppError(400, "Liên kết xác nhận không hợp lệ hoặc đã hết hạn.", "invalid_token")
    if not user.is_active:
        raise AppError(403, "Tài khoản đã bị khóa. Liên hệ quản trị viên.", "account_disabled")
    if not user.email_verified:
        user.email_verified = True
    user.last_login_at = utcnow()
    db.commit()
    return issue_token(user)


def login(db: Session, email: str, password: str) -> TokenOut:
    key = normalize_email(email)
    with _fail_lock:
        if len(_recent_failures(key)) >= _MAX_FAILURES:
            raise AppError(429, "Đăng nhập sai quá nhiều lần. Thử lại sau 15 phút.", "too_many_attempts")

    user = find_user(db, key)
    if user is None or not verify_password(password, user.password_hash):
        with _fail_lock:
            _recent_failures(key).append(time.monotonic())
        raise AppError(401, "Email hoặc mật khẩu không đúng.", "invalid_credentials")

    with _fail_lock:
        _failures.pop(key, None)
    if not user.is_active:
        raise AppError(403, "Tài khoản đã bị khóa. Liên hệ quản trị viên.", "account_disabled")
    if not user.email_verified:
        raise AppError(403, "Email chưa được xác nhận. Kiểm tra hộp thư hoặc gửi lại email xác nhận.", "email_not_verified")

    user.last_login_at = utcnow()
    db.commit()
    return issue_token(user)


def forgot_password(db: Session, email: str) -> MessageOut:
    user = find_user(db, email)
    sent = True
    if user is not None and user.is_active:
        sent = send_reset_email(user)
    return MessageOut(
        message="Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi." if sent
        else "Không gửi được email. Thử lại sau hoặc liên hệ quản trị viên.",
        email_sent=sent,
    )


def reset_password(db: Session, token: str, new_password: str) -> TokenOut:
    claims = decode_token(token, "reset")
    user = db.get(User, claims["sub"]) if claims else None
    if user is None or claims.get("tv") != user.token_version:
        raise AppError(400, "Liên kết đặt lại mật khẩu không hợp lệ, đã dùng hoặc đã hết hạn.", "invalid_token")
    if not user.is_active:
        raise AppError(403, "Tài khoản đã bị khóa. Liên hệ quản trị viên.", "account_disabled")
    user.password_hash = hash_password(new_password)
    user.token_version += 1
    # Receiving the reset link proves the address.
    user.email_verified = True
    user.last_login_at = utcnow()
    db.commit()
    return issue_token(user)


def update_profile(db: Session, user: User, body: ProfileUpdateIn) -> TokenOut:
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.new_password is not None:
        if not body.current_password or not verify_password(body.current_password, user.password_hash):
            raise AppError(400, "Mật khẩu hiện tại không đúng.", "wrong_password")
        user.password_hash = hash_password(body.new_password)
        user.token_version += 1
    db.commit()
    # A password change revokes old tokens, so hand back a fresh one.
    return issue_token(user)
