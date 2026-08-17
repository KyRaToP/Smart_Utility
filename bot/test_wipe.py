from __future__ import annotations

from pathlib import Path

from app.db_reader import connect
from app.db_wipe import wipe_user_data


def test_wipe_missing_file(tmp_path: Path) -> None:
    wipe_user_data(tmp_path / "missing.db", 42)


def test_wipe_one_user_keeps_another(tmp_path: Path) -> None:
    db_path = tmp_path / "smart.db"
    with connect(db_path) as connection:
        connection.executescript(
            """
            CREATE TABLE users (
                telegram_id INTEGER PRIMARY KEY,
                display_name TEXT,
                onboarded INTEGER DEFAULT 0,
                active_apartment_id TEXT
            );
            CREATE TABLE apartments (
                id TEXT PRIMARY KEY,
                telegram_id INTEGER,
                name TEXT,
                rooms REAL,
                area_m2 REAL,
                reading_due_day INTEGER
            );
            CREATE TABLE services (
                id TEXT PRIMARY KEY,
                apartment_id TEXT,
                name TEXT,
                category TEXT,
                calc_type TEXT,
                unit TEXT,
                tariff REAL,
                night_tariff REAL,
                has_meter INTEGER,
                is_active INTEGER
            );
            CREATE TABLE meters (
                id TEXT PRIMARY KEY,
                service_id TEXT,
                name TEXT,
                zone TEXT
            );
            CREATE TABLE readings (
                id TEXT PRIMARY KEY,
                meter_id TEXT,
                month TEXT,
                value REAL,
                is_initial INTEGER
            );
            CREATE TABLE charges (
                id TEXT PRIMARY KEY,
                apartment_id TEXT,
                month TEXT,
                service_id TEXT,
                amount REAL,
                consumption REAL,
                formula_snapshot TEXT
            );
            CREATE TABLE payments (
                id TEXT PRIMARY KEY,
                apartment_id TEXT,
                month TEXT,
                amount REAL,
                paid_at TEXT,
                status TEXT
            );
            INSERT INTO users (telegram_id, display_name, onboarded) VALUES (1, 'A', 1);
            INSERT INTO users (telegram_id, display_name, onboarded) VALUES (2, 'B', 1);
            INSERT INTO apartments (id, telegram_id, name, reading_due_day)
            VALUES ('apt-1', 1, 'Дом', 25);
            INSERT INTO apartments (id, telegram_id, name, reading_due_day)
            VALUES ('apt-2', 2, 'Дача', 20);
            INSERT INTO services (
                id, apartment_id, name, category, calc_type, unit, tariff,
                has_meter, is_active
            ) VALUES ('svc-1', 'apt-1', 'Вода', 'Вода', 'metered', 'м³', 40, 1, 1);
            INSERT INTO meters (id, service_id, name, zone)
            VALUES ('m-1', 'svc-1', 'ХВС', 'single');
            INSERT INTO readings (id, meter_id, month, value, is_initial)
            VALUES ('r-1', 'm-1', '2026-08', 10, 1);
            """
        )
        connection.commit()

    wipe_user_data(db_path, 1)

    with connect(db_path) as connection:
        assert connection.execute(
            "SELECT COUNT(*) AS n FROM users WHERE telegram_id = 1"
        ).fetchone()["n"] == 0
        assert connection.execute(
            "SELECT COUNT(*) AS n FROM apartments WHERE telegram_id = 1"
        ).fetchone()["n"] == 0
        assert connection.execute("SELECT COUNT(*) AS n FROM services").fetchone()["n"] == 0
        assert connection.execute("SELECT COUNT(*) AS n FROM meters").fetchone()["n"] == 0
        assert connection.execute("SELECT COUNT(*) AS n FROM readings").fetchone()["n"] == 0
        assert connection.execute(
            "SELECT COUNT(*) AS n FROM users WHERE telegram_id = 2"
        ).fetchone()["n"] == 1
        assert (
            connection.execute(
                "SELECT name FROM apartments WHERE telegram_id = 2"
            ).fetchone()["name"]
            == "Дача"
        )
