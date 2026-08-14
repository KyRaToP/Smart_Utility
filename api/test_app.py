from __future__ import annotations

import os
from pathlib import Path

os.environ["DEV_AUTH"] = "1"
os.environ["ALLOWED_TELEGRAM_IDS"] = ""

from fastapi.testclient import TestClient

from app import main
from app.calc import compute_consumption, compute_metered_amount
from app.db import Store


def client_for(tmp_path: Path) -> TestClient:
    main._store = Store(tmp_path / "test.db")
    return TestClient(main.app)


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
