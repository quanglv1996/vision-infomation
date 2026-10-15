"""Account endpoints: register → confirm email → login, profile, password reset."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import (
    EmailIn,
    LoginIn,
    MessageOut,
    ProfileUpdateIn,
    RegisterIn,
    ResetPasswordIn,
    TokenIn,
    TokenOut,
    UserOut,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=MessageOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)) -> MessageOut:
    """Create an unconfirmed account and email a confirmation link."""
    return auth_service.register(db, body)


@router.post("/verify-email", response_model=TokenOut)
def verify_email(body: TokenIn, db: Session = Depends(get_db)) -> TokenOut:
    """Confirm the address from the emailed link; signs the user in."""
    return auth_service.verify_email(db, body.token)


@router.post("/resend-verification", response_model=MessageOut, status_code=202)
def resend_verification(body: EmailIn, db: Session = Depends(get_db)) -> MessageOut:
    return auth_service.resend_verification(db, body.email)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    return auth_service.login(db, body.email, body.password)


@router.post("/forgot-password", response_model=MessageOut, status_code=202)
def forgot_password(body: EmailIn, db: Session = Depends(get_db)) -> MessageOut:
    return auth_service.forgot_password(db, body.email)


@router.post("/reset-password", response_model=TokenOut)
def reset_password(body: ResetPasswordIn, db: Session = Depends(get_db)) -> TokenOut:
    return auth_service.reset_password(db, body.token, body.new_password)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=TokenOut)
def update_me(body: ProfileUpdateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> TokenOut:
    """Change display name and/or password (needs current_password); returns a fresh token."""
    return auth_service.update_profile(db, user, body)
