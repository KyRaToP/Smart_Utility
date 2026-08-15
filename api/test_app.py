from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from pathlib import Path
from urllib.parse import urlencode

os.environ["DEV_AUTH"] = "1"
os.environ["ALLOWED_TELEGRAM_IDS"] = ""

from fastapi.testclient import TestClient

from app import main
from app.auth import AuthError, validate_init_data
from app.calc import compute_consumption, compute_metered_amount
from app.db import Store


def client_for(tmp_path: Path) -> TestClient:
    main._store = Store(tmp_path / "test.db")
    return TestClient(main.app)


def _signed_init_data(token: str, telegram_id: int, auth_date: int | None = None) -> str:
    """Build Telegram-like initData with a valid HMAC hash for tests."""
    user = json.dumps({"id": telegram_id, "first_name": "Test"}, separators=(",", ":"))
    fields = {
        "auth_date": str(auth_date if auth_date is not None else int(time.time())),
        "user": user,
    }
    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(fields.items()))
    secret_key = hmac.new(b"WebAppData", token.encode("utf-8"), hashlib.sha256).digest()
    fields["hash"] = hmac.new(
        secret_key,
        data_check_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return urlencode(fields)


def test_consumption_formula() -> None:
    assert compute_consumption(128.2, 124.8) == 3.4
    assert compute_metered_amount(3.4, 45.2) == 153.68


def test_health() -> None:
    response = TestClient(main.app).get("/api/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_users_are_isolated(tmp_path: Path) -> None:
    client = client_for(tmp_path)
    first = [
        {"name": "Дом А", "rooms": "2", "areaM2": "50"},
        {"name": "Студия А", "rooms": "", "areaM2": ""},
        {"name": "Дача А", "rooms": "", "areaM2": ""},
    ]
    second = [
        {"name": "Дом Б", "rooms": "3", "areaM2": "70"},
        {"name": "Студия Б", "rooms": "", "areaM2": ""},
        {"name": "Дача Б", "rooms": "", "areaM2": ""},
    ]
    assert (
        client.post(
            "/api/onboarding",
            json={"apartments": first},
            headers={"X-Dev-Telegram-Id": "1001"},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/onboarding",
            json={"apartments": second},
            headers={"X-Dev-Telegram-Id": "2002"},
        ).status_code
        == 200
    )

    state_a = client.get("/api/state", headers={"X-Dev-Telegram-Id": "1001"}).json()
    state_b = client.get("/api/state", headers={"X-Dev-Telegram-Id": "2002"}).json()
    names_a = {item["name"] for item in state_a["apartments"]}
    names_b = {item["name"] for item in state_b["apartments"]}
    assert names_a == {"Дом А", "Студия А", "Дача А"}
    assert names_b == {"Дом Б", "Студия Б", "Дача Б"}


def test_fixed_service_calculation(tmp_path: Path) -> None:
    client = client_for(tmp_path)
    headers = {"X-Dev-Telegram-Id": "1001"}
    client.post(
        "/api/onboarding",
        json={
            "apartments": [
                {"name": "Одна", "rooms": "", "areaM2": ""},
                {"name": "Две", "rooms": "", "areaM2": ""},
                {"name": "Три", "rooms": "", "areaM2": ""},
            ]
        },
        headers=headers,
    )
    client.post(
        "/api/services",
        json={
            "name": "Интернет",
            "category": "Интернет",
            "unit": "₽",
            "tariff": "650",
            "hasMeter": False,
            "calcType": "fixed",
        },
        headers=headers,
    )
    result = client.post(
        "/api/calculations",
        json={"month": "2026-08", "values": {}},
        headers=headers,
    )
    assert result.status_code == 200
    payload = result.json()
    assert payload["charges"][0]["amount"] == 650
    assert payload["payments"][0]["status"] == "pending"
    assert payload["payments"][0]["amount"] == 650


def test_baseline_readings_for_next_month(tmp_path: Path) -> None:
    client = client_for(tmp_path)
    headers = {"X-Dev-Telegram-Id": "1001"}
    client.post(
        "/api/onboarding",
        json={
            "apartments": [
                {"name": "Одна", "rooms": "", "areaM2": ""},
                {"name": "Две", "rooms": "", "areaM2": ""},
                {"name": "Три", "rooms": "", "areaM2": ""},
            ]
        },
        headers=headers,
    )
    client.post(
        "/api/services",
        json={
            "name": "Холодная вода",
            "category": "Вода",
            "unit": "м³",
            "tariff": "40",
            "hasMeter": True,
            "calcType": "metered",
        },
        headers=headers,
    )
    state = client.get("/api/state", headers=headers).json()
    meter_id = state["meters"][0]["id"]

    baseline = client.post(
        "/api/baseline",
        json={
            "month": "2026-08",
            "values": {meter_id: 1010},
            "markPaid": True,
            "paidAt": "2026-08-20",
        },
        headers=headers,
    )
    assert baseline.status_code == 200
    body = baseline.json()
    assert any(
        item["meterId"] == meter_id and item["month"] == "2026-08" and item["value"] == 1010
        for item in body["readings"]
    )
    assert any(
        item["month"] == "2026-08" and item["status"] == "paid" for item in body["payments"]
    )

    september = client.post(
        "/api/calculations",
        json={"month": "2026-09", "values": {meter_id: 1050}},
        headers=headers,
    )
    assert september.status_code == 200
    charges = september.json()["charges"]
    assert len(charges) == 1
    assert charges[0]["consumption"] == 40
    assert charges[0]["amount"] == 1600


def test_init_data_rejects_expired_auth_date() -> None:
    token = "test-bot-token"
    expired = int(time.time()) - 90_000
    init_data = _signed_init_data(token, telegram_id=42, auth_date=expired)
    try:
        validate_init_data(init_data, token)
        raise AssertionError("expected AuthError for expired initData")
    except AuthError as error:
        assert "expired" in str(error)


def test_init_data_accepts_fresh_auth_date() -> None:
    token = "test-bot-token"
    init_data = _signed_init_data(token, telegram_id=42)
    user = validate_init_data(init_data, token)
    assert user["id"] == 42


def test_telegram_path_requires_allowlist(tmp_path: Path, monkeypatch) -> None:
    token = "test-bot-token"
    monkeypatch.setenv("DEV_AUTH", "0")
    monkeypatch.setenv("BOT_TOKEN", token)
    monkeypatch.setenv("ALLOWED_TELEGRAM_IDS", "")
    client = client_for(tmp_path)
    init_data = _signed_init_data(token, telegram_id=42)
    response = client.get(
        "/api/state",
        headers={"X-Telegram-Init-Data": init_data},
    )
    assert response.status_code == 503
    assert "ALLOWED_TELEGRAM_IDS" in response.json()["detail"]


def test_telegram_path_allows_listed_user(tmp_path: Path, monkeypatch) -> None:
    token = "test-bot-token"
    monkeypatch.setenv("DEV_AUTH", "0")
    monkeypatch.setenv("BOT_TOKEN", token)
    monkeypatch.setenv("ALLOWED_TELEGRAM_IDS", "42")
    client = client_for(tmp_path)
    init_data = _signed_init_data(token, telegram_id=42)
    response = client.get(
        "/api/state",
        headers={"X-Telegram-Init-Data": init_data},
    )
    assert response.status_code == 200
    assert response.json()["displayName"] == "Test"


def test_telegram_path_rejects_user_outside_allowlist(tmp_path: Path, monkeypatch) -> None:
    token = "test-bot-token"
    monkeypatch.setenv("DEV_AUTH", "0")
    monkeypatch.setenv("BOT_TOKEN", token)
    monkeypatch.setenv("ALLOWED_TELEGRAM_IDS", "42")
    client = client_for(tmp_path)
    init_data = _signed_init_data(token, telegram_id=99)
    response = client.get(
        "/api/state",
        headers={"X-Telegram-Init-Data": init_data},
    )
    assert response.status_code == 403
