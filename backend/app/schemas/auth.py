"""Authentication and user-account schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Role = Literal["admin", "user"]

Password = Field(min_length=8, max_length=128)
# For looking up existing accounts: also accepts intranet domains (admin@corp.local)
# that EmailStr rejects. New addresses (registration, admin create) use EmailStr.
LooseEmail = Field(min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+$")


def _clean_name(v: Optional[str]) -> Optional[str]:
    return v.strip() if isinstance(v, str) else v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: Role
    is_active: bool
    email_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int          # seconds
    user: UserOut


class MessageOut(BaseModel):
    message: str
    email_sent: bool = True


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Password
    full_name: str = Field(min_length=1, max_length=100)

    _name = field_validator("full_name")(_clean_name)


class LoginIn(BaseModel):
    email: str = LooseEmail
    password: str = Field(min_length=1, max_length=128)


class EmailIn(BaseModel):
    email: str = LooseEmail


class TokenIn(BaseModel):
    token: str = Field(min_length=10, max_length=2048)


class ResetPasswordIn(TokenIn):
    new_password: str = Password


class ProfileUpdateIn(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    current_password: Optional[str] = Field(default=None, max_length=128)
    new_password: Optional[str] = Field(default=None, min_length=8, max_length=128)

    _name = field_validator("full_name")(_clean_name)


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminUserOut(UserOut):
    config_count: int = 0
    updated_at: datetime


class AdminUserCreateIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)
    password: str = Password
    role: Role = "user"
    is_active: bool = True
    # Accounts made by an admin are confirmed by default; set False (and
    # send_verification) to make the user confirm the address themselves.
    email_verified: bool = True
    send_verification: bool = False

    _name = field_validator("full_name")(_clean_name)


class AdminUserUpdateIn(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    role: Optional[Role] = None
    is_active: Optional[bool] = None
    email_verified: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)

    _name = field_validator("full_name")(_clean_name)
