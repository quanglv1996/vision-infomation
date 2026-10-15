"""Accounts, admin management and saved configurations."""
import re
import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.mailer import OUTBOX
from main import app

ADMIN = {"email": "admin@test.local", "password": "admin-pass-123"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def _email() -> str:
    return f"u{uuid.uuid4().hex[:10]}@example.com"


def _link_token(to: str, kind: str) -> str:
    mail = next(m for m in reversed(OUTBOX) if m.to == to)
    return re.search(rf"\?{kind}=([\w\-.]+)", mail.text).group(1)


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _login(client, email: str, password: str) -> str:
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _verified_user(client, password: str = "secret-pass-1") -> tuple[str, str]:
    email = _email()
    assert client.post("/api/auth/register", json={"email": email, "password": password, "full_name": "Test"}).status_code == 201
    r = client.post("/api/auth/verify-email", json={"token": _link_token(email, "verify")})
    assert r.status_code == 200
    return email, r.json()["access_token"]


class TestRegistration:
    def test_register_verify_login(self, client):
        email = _email().upper()
        r = client.post("/api/auth/register", json={"email": email, "password": "secret-pass-1", "full_name": " Nguyễn A "})
        assert r.status_code == 201 and r.json()["email_sent"]

        r = client.post("/api/auth/login", json={"email": email, "password": "secret-pass-1"})
        assert r.status_code == 403 and r.json()["detail"]["code"] == "email_not_verified"

        r = client.post("/api/auth/register", json={"email": email, "password": "secret-pass-1", "full_name": "A"})
        assert r.status_code == 409 and r.json()["detail"]["code"] == "email_pending"

        r = client.post("/api/auth/verify-email", json={"token": _link_token(email.lower(), "verify")})
        assert r.status_code == 200
        user = r.json()["user"]
        assert user["email"] == email.lower() and user["email_verified"] and user["full_name"] == "Nguyễn A"

        token = _login(client, email, "secret-pass-1")
        me = client.get("/api/auth/me", headers=_auth(token)).json()
        assert me["role"] == "user"

        r = client.post("/api/auth/register", json={"email": email, "password": "secret-pass-1", "full_name": "A"})
        assert r.json()["detail"]["code"] == "email_taken"

    def test_validation(self, client):
        assert client.post("/api/auth/register", json={"email": "bad", "password": "secret-pass-1", "full_name": "A"}).status_code == 422
        assert client.post("/api/auth/register", json={"email": _email(), "password": "short", "full_name": "A"}).status_code == 422

    def test_wrong_password_and_bad_tokens(self, client):
        email, _ = _verified_user(client)
        r = client.post("/api/auth/login", json={"email": email, "password": "nope-nope"})
        assert r.status_code == 401 and r.json()["detail"]["code"] == "invalid_credentials"
        assert client.post("/api/auth/verify-email", json={"token": "x" * 40}).status_code == 400
        assert client.get("/api/auth/me").status_code == 401
        assert client.get("/api/auth/me", headers=_auth("garbage")).status_code == 401

    def test_resend_does_not_leak(self, client):
        r = client.post("/api/auth/resend-verification", json={"email": _email()})
        assert r.status_code == 202

    def test_password_reset_single_use(self, client):
        email, old_token = _verified_user(client)
        assert client.post("/api/auth/forgot-password", json={"email": email}).status_code == 202
        token = _link_token(email, "reset")
        r = client.post("/api/auth/reset-password", json={"token": token, "new_password": "brand-new-pass"})
        assert r.status_code == 200
        assert client.post("/api/auth/reset-password", json={"token": token, "new_password": "another-pass"}).status_code == 400
        assert client.get("/api/auth/me", headers=_auth(old_token)).status_code == 401
        _login(client, email, "brand-new-pass")

    def test_profile_password_change_revokes_tokens(self, client):
        email, token = _verified_user(client)
        r = client.patch("/api/auth/me", headers=_auth(token), json={"new_password": "changed-pass-1", "current_password": "wrong"})
        assert r.status_code == 400
        r = client.patch("/api/auth/me", headers=_auth(token),
                         json={"full_name": "Renamed", "new_password": "changed-pass-1", "current_password": "secret-pass-1"})
        assert r.status_code == 200 and r.json()["user"]["full_name"] == "Renamed"
        assert client.get("/api/auth/me", headers=_auth(token)).status_code == 401
        assert client.get("/api/auth/me", headers=_auth(r.json()["access_token"])).status_code == 200


class TestAdmin:
    def test_bootstrap_admin(self, client):
        token = _login(client, **ADMIN)
        assert client.get("/api/auth/me", headers=_auth(token)).json()["role"] == "admin"

    def test_non_admin_forbidden(self, client):
        _, token = _verified_user(client)
        assert client.get("/api/admin/users", headers=_auth(token)).status_code == 403

    def test_user_crud(self, client):
        admin = _auth(_login(client, **ADMIN))
        email = _email()
        r = client.post("/api/admin/users", headers=admin, json={"email": email, "full_name": "Op", "password": "op-pass-123"})
        assert r.status_code == 201
        uid = r.json()["id"]
        user_token = _login(client, email, "op-pass-123")

        listed = client.get("/api/admin/users", headers=admin, params={"q": email[:8]}).json()
        assert [u["id"] for u in listed] == [uid]

        r = client.patch(f"/api/admin/users/{uid}", headers=admin, json={"is_active": False})
        assert r.status_code == 200 and not r.json()["is_active"]
        assert client.get("/api/auth/me", headers=_auth(user_token)).status_code == 401
        assert client.post("/api/auth/login", json={"email": email, "password": "op-pass-123"}).json()["detail"]["code"] == "account_disabled"

        assert any(u["id"] == uid for u in client.get("/api/admin/users", headers=admin, params={"status": "disabled"}).json())

        r = client.patch(f"/api/admin/users/{uid}", headers=admin, json={"is_active": True, "role": "admin", "password": "new-op-pass"})
        assert r.json()["role"] == "admin"
        _login(client, email, "new-op-pass")

        assert client.delete(f"/api/admin/users/{uid}", headers=admin).status_code == 204
        assert client.patch(f"/api/admin/users/{uid}", headers=admin, json={"full_name": "x"}).status_code == 404

    def test_pending_user_can_be_approved(self, client):
        admin = _auth(_login(client, **ADMIN))
        email = _email()
        client.post("/api/auth/register", json={"email": email, "password": "secret-pass-1", "full_name": "P"})
        pending = client.get("/api/admin/users", headers=admin, params={"status": "pending"}).json()
        uid = next(u["id"] for u in pending if u["email"] == email)
        assert client.post(f"/api/admin/users/{uid}/send-verification", headers=admin).json()["email_sent"]
        client.patch(f"/api/admin/users/{uid}", headers=admin, json={"email_verified": True})
        _login(client, email, "secret-pass-1")

    def test_self_protection(self, client):
        token = _login(client, **ADMIN)
        me = client.get("/api/auth/me", headers=_auth(token)).json()
        assert client.delete(f"/api/admin/users/{me['id']}", headers=_auth(token)).json()["detail"]["code"] == "self_protect"
        r = client.patch(f"/api/admin/users/{me['id']}", headers=_auth(token), json={"role": "user"})
        assert r.json()["detail"]["code"] == "self_protect"

    def test_duplicate_email(self, client):
        admin = _auth(_login(client, **ADMIN))
        email, _ = _verified_user(client)
        r = client.post("/api/admin/users", headers=admin, json={"email": email.upper(), "full_name": "X", "password": "whatever-1"})
        assert r.status_code == 409


class TestConfigs:
    BODY = {
        "name": "Băng tải A",
        "description": "Line 1",
        "scenario_id": "static",
        "mode": "wd",
        "values": {"resolution_x": 2448, "pixel_size": 3.45},
    }

    def test_requires_login(self, client):
        assert client.get("/api/configs").status_code == 401

    def test_crud(self, client):
        _, token = _verified_user(client)
        h = _auth(token)
        r = client.post("/api/configs", headers=h, json=self.BODY)
        assert r.status_code == 201
        cfg = r.json()
        assert cfg["results"]["sensor_width"] == pytest.approx(2448 * 3.45 / 1000)

        r = client.patch(f"/api/configs/{cfg['id']}", headers=h, json={"values": {"resolution_x": 4096, "pixel_size": 3.45}})
        assert r.json()["results"]["sensor_width"] == pytest.approx(4096 * 3.45 / 1000)
        assert r.json()["scenario_id"] == "static"

        r = client.patch(f"/api/configs/{cfg['id']}", headers=h, json={"scenario_id": None, "mode": None})
        assert r.json()["scenario_id"] is None

        dup = client.post(f"/api/configs/{cfg['id']}/duplicate", headers=h).json()
        assert dup["name"].endswith("(bản sao)") and dup["id"] != cfg["id"]

        assert len(client.get("/api/configs", headers=h).json()) == 2
        assert len(client.get("/api/configs", headers=h, params={"scenario_id": "free"}).json()) == 2
        assert len(client.get("/api/configs", headers=h, params={"q": "bản sao"}).json()) == 1

        assert client.delete(f"/api/configs/{dup['id']}", headers=h).status_code == 204
        assert client.get(f"/api/configs/{dup['id']}", headers=h).status_code == 404

    def test_rejects_unknown_parameters(self, client):
        _, token = _verified_user(client)
        r = client.post("/api/configs", headers=_auth(token), json={**self.BODY, "values": {"nope": 1}})
        assert r.status_code == 422

    def test_owner_isolation(self, client):
        _, a = _verified_user(client)
        _, b = _verified_user(client)
        cid = client.post("/api/configs", headers=_auth(a), json=self.BODY).json()["id"]
        assert client.get(f"/api/configs/{cid}", headers=_auth(b)).status_code == 404
        assert client.delete(f"/api/configs/{cid}", headers=_auth(b)).status_code == 404
        assert client.get("/api/configs", headers=_auth(b)).json() == []

    def test_deleting_user_deletes_configs(self, client):
        email, token = _verified_user(client)
        client.post("/api/configs", headers=_auth(token), json=self.BODY)
        admin = _auth(_login(client, **ADMIN))
        user = next(u for u in client.get("/api/admin/users", headers=admin, params={"q": email}).json())
        assert user["config_count"] == 1
        assert client.delete(f"/api/admin/users/{user['id']}", headers=admin).status_code == 204
