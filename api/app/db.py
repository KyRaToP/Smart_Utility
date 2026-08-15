from __future__ import annotations

import sqlite3
from pathlib import Path

from .calc import (
    ChargeDraft,
    compute_by_area_amount,
    compute_consumption,
    compute_fixed_amount,
    compute_metered_amount,
    compute_two_zone_amount,
    describe_formula,
    round_money,
)

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL DEFAULT '',
    onboarded INTEGER NOT NULL DEFAULT 0,
    active_apartment_id TEXT,
    readings_enabled INTEGER NOT NULL DEFAULT 1,
    readings_days_before INTEGER NOT NULL DEFAULT 3,
    payment_enabled INTEGER NOT NULL DEFAULT 1,
    payment_days_before INTEGER NOT NULL DEFAULT 2,
    report_enabled INTEGER NOT NULL DEFAULT 1,
    report_day INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS apartments (
    id TEXT PRIMARY KEY,
    telegram_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    rooms REAL,
    area_m2 REAL,
    reading_due_day INTEGER NOT NULL DEFAULT 25,
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
);

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    apartment_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    calc_type TEXT NOT NULL,
    unit TEXT NOT NULL,
    tariff REAL NOT NULL,
    night_tariff REAL,
    has_meter INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id)
);

CREATE TABLE IF NOT EXISTS meters (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    name TEXT NOT NULL,
    zone TEXT NOT NULL DEFAULT 'single',
    FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE IF NOT EXISTS readings (
    id TEXT PRIMARY KEY,
    meter_id TEXT NOT NULL,
    month TEXT NOT NULL,
    value REAL NOT NULL,
    is_initial INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (meter_id) REFERENCES meters(id)
);

CREATE TABLE IF NOT EXISTS charges (
    id TEXT PRIMARY KEY,
    apartment_id TEXT NOT NULL,
    month TEXT NOT NULL,
    service_id TEXT NOT NULL,
    amount REAL NOT NULL,
    consumption REAL,
    formula_snapshot TEXT NOT NULL,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    apartment_id TEXT NOT NULL,
    month TEXT NOT NULL,
    amount REAL NOT NULL,
    paid_at TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id)
);
"""


class Store:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        db_path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(SCHEMA)

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def ensure_user(self, telegram_id: int, display_name: str) -> None:
        with self.connect() as connection:
            existing = connection.execute(
                "SELECT telegram_id FROM users WHERE telegram_id = ?",
                (telegram_id,),
            ).fetchone()
            if existing is None:
                connection.execute(
                    """
                    INSERT INTO users (telegram_id, display_name)
                    VALUES (?, ?)
                    """,
                    (telegram_id, display_name),
                )
            elif display_name:
                connection.execute(
                    "UPDATE users SET display_name = ? WHERE telegram_id = ?",
                    (display_name, telegram_id),
                )
            connection.commit()

    def load_state(self, telegram_id: int) -> dict:
        with self.connect() as connection:
            user = connection.execute(
                "SELECT * FROM users WHERE telegram_id = ?",
                (telegram_id,),
            ).fetchone()
            if user is None:
                return empty_state(display_name="")

            apartments = rows(
                connection.execute(
                    "SELECT * FROM apartments WHERE telegram_id = ? ORDER BY name",
                    (telegram_id,),
                )
            )
            apartment_ids = [item["id"] for item in apartments]
            services = rows(self._in_query(connection, "services", "apartment_id", apartment_ids))
            service_ids = [item["id"] for item in services]
            meters = rows(self._in_query(connection, "meters", "service_id", service_ids))
            meter_ids = [item["id"] for item in meters]
            readings = rows(self._in_query(connection, "readings", "meter_id", meter_ids))
            charges = rows(self._in_query(connection, "charges", "apartment_id", apartment_ids))
            payments = rows(self._in_query(connection, "payments", "apartment_id", apartment_ids))

        return {
            "onboarded": bool(user["onboarded"]),
            "displayName": user["display_name"],
            "apartments": [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "rooms": item["rooms"],
                    "areaM2": item["area_m2"],
                    "readingDueDay": item["reading_due_day"],
                }
                for item in apartments
            ],
            "activeApartmentId": user["active_apartment_id"],
            "services": [
                {
                    "id": item["id"],
                    "apartmentId": item["apartment_id"],
                    "name": item["name"],
                    "category": item["category"],
                    "calcType": item["calc_type"],
                    "unit": item["unit"],
                    "tariff": item["tariff"],
                    "nightTariff": item["night_tariff"],
                    "hasMeter": bool(item["has_meter"]),
                    "isActive": bool(item["is_active"]),
                }
                for item in services
            ],
            "meters": [
                {
                    "id": item["id"],
                    "serviceId": item["service_id"],
                    "name": item["name"],
                    "zone": item["zone"],
                }
                for item in meters
            ],
            "readings": [
                {
                    "id": item["id"],
                    "meterId": item["meter_id"],
                    "month": item["month"],
                    "value": item["value"],
                    "isInitial": bool(item["is_initial"]),
                }
                for item in readings
            ],
            "charges": [
                {
                    "id": item["id"],
                    "apartmentId": item["apartment_id"],
                    "month": item["month"],
                    "serviceId": item["service_id"],
                    "amount": item["amount"],
                    "consumption": item["consumption"],
                    "formulaSnapshot": item["formula_snapshot"],
                }
                for item in charges
            ],
            "payments": [
                {
                    "id": item["id"],
                    "apartmentId": item["apartment_id"],
                    "month": item["month"],
                    "amount": item["amount"],
                    "paidAt": item["paid_at"],
                    "status": item["status"],
                }
                for item in payments
            ],
            "notifications": {
                "readingsEnabled": bool(user["readings_enabled"]),
                "readingsDaysBefore": user["readings_days_before"],
                "paymentEnabled": bool(user["payment_enabled"]),
                "paymentDaysBefore": user["payment_days_before"],
                "reportEnabled": bool(user["report_enabled"]),
                "reportDay": user["report_day"],
            },
        }

    def _in_query(
        self,
        connection: sqlite3.Connection,
        table: str,
        column: str,
        ids: list[str],
    ) -> sqlite3.Cursor:
        if not ids:
            return connection.execute(f"SELECT * FROM {table} WHERE 0")
        placeholders = ",".join("?" for _ in ids)
        return connection.execute(
            f"SELECT * FROM {table} WHERE {column} IN ({placeholders})",
            ids,
        )

    def complete_onboarding(
        self,
        telegram_id: int,
        display_name: str,
        apartments: list[dict],
        new_id,
    ) -> None:
        created = []
        with self.connect() as connection:
            connection.execute("DELETE FROM apartments WHERE telegram_id = ?", (telegram_id,))
            for item in apartments:
                apartment_id = new_id("apt")
                created.append(apartment_id)
                connection.execute(
                    """
                    INSERT INTO apartments (id, telegram_id, name, rooms, area_m2, reading_due_day)
                    VALUES (?, ?, ?, ?, ?, 25)
                    """,
                    (
                        apartment_id,
                        telegram_id,
                        item["name"].strip(),
                        to_float(item.get("rooms")),
                        to_float(item.get("areaM2")),
                    ),
                )
            connection.execute(
                """
                UPDATE users
                SET onboarded = 1, display_name = ?, active_apartment_id = ?
                WHERE telegram_id = ?
                """,
                (display_name, created[0] if created else None, telegram_id),
            )
            connection.commit()

    def set_active_apartment(self, telegram_id: int, apartment_id: str) -> None:
        self._owned_apartment(telegram_id, apartment_id)
        with self.connect() as connection:
            connection.execute(
                "UPDATE users SET active_apartment_id = ? WHERE telegram_id = ?",
                (apartment_id, telegram_id),
            )
            connection.commit()

    def update_apartment(self, telegram_id: int, apartment_id: str, patch: dict) -> None:
        self._owned_apartment(telegram_id, apartment_id)
        with self.connect() as connection:
            connection.execute(
                """
                UPDATE apartments
                SET name = ?, rooms = ?, area_m2 = ?, reading_due_day = ?
                WHERE id = ? AND telegram_id = ?
                """,
                (
                    patch["name"].strip() or "Квартира",
                    to_float(patch.get("rooms")),
                    to_float(patch.get("areaM2")),
                    int(patch.get("readingDueDay") or 25),
                    apartment_id,
                    telegram_id,
                ),
            )
            connection.commit()

    def add_service(self, telegram_id: int, payload: dict, new_id) -> None:
        apartment_id = self._active_apartment(telegram_id)
        service_id = new_id("svc")
        calc_type = payload["calcType"]
        has_meter = bool(payload.get("hasMeter"))
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO services (
                    id, apartment_id, name, category, calc_type, unit, tariff,
                    night_tariff, has_meter, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 1)
                """,
                (
                    service_id,
                    apartment_id,
                    payload["name"].strip(),
                    (payload.get("category") or payload["name"]).strip(),
                    calc_type,
                    (payload.get("unit") or "₽").strip(),
                    float(payload["tariff"]),
                    1 if has_meter else 0,
                ),
            )
            if has_meter and calc_type == "two_zone":
                connection.execute(
                    "INSERT INTO meters (id, service_id, name, zone) VALUES (?, ?, ?, ?)",
                    (new_id("meter"), service_id, "День", "day"),
                )
                connection.execute(
                    "INSERT INTO meters (id, service_id, name, zone) VALUES (?, ?, ?, ?)",
                    (new_id("meter"), service_id, "Ночь", "night"),
                )
            elif has_meter:
                connection.execute(
                    "INSERT INTO meters (id, service_id, name, zone) VALUES (?, ?, ?, ?)",
                    (new_id("meter"), service_id, payload["name"].strip(), "single"),
                )
            connection.commit()

    def save_readings(self, telegram_id: int, month: str, values: dict[str, float], new_id) -> None:
        self._assert_meters_owned(telegram_id, list(values.keys()))
        with self.connect() as connection:
            for meter_id, value in values.items():
                connection.execute(
                    "DELETE FROM readings WHERE meter_id = ? AND month = ?",
                    (meter_id, month),
                )
                previous = connection.execute(
                    """
                    SELECT value FROM readings
                    WHERE meter_id = ? AND month < ?
                    ORDER BY month DESC LIMIT 1
                    """,
                    (meter_id, month),
                ).fetchone()
                connection.execute(
                    """
                    INSERT INTO readings (id, meter_id, month, value, is_initial)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (new_id("reading"), meter_id, month, float(value), 0 if previous else 1),
                )
            connection.commit()

    def save_baseline(
        self,
        telegram_id: int,
        month: str,
        values: dict[str, float],
        mark_paid: bool,
        paid_at: str | None,
        new_id,
    ) -> None:
        """Store end-of-month readings used as baseline for the next month."""
        if not values:
            raise ValueError("Need at least one meter reading")
        self.save_readings(telegram_id, month, values, new_id)
        if not mark_paid:
            return
        state = self.load_state(telegram_id)
        apartment_id = state["activeApartmentId"]
        if not apartment_id:
            raise ValueError("No active apartment")
        self.mark_paid(
            telegram_id,
            apartment_id,
            month,
            paid_at or f"{month}-28",
        )

    def save_calculation(
        self,
        telegram_id: int,
        month: str,
        values: dict[str, float],
        new_id,
    ) -> None:
        if values:
            self.save_readings(telegram_id, month, values, new_id)
        state = self.load_state(telegram_id)
        apartment_id = state["activeApartmentId"]
        if not apartment_id:
            raise ValueError("No active apartment")
        current_readings = {
            item["meterId"]: float(item["value"])
            for item in state["readings"]
            if item["month"] == month
        }
        current_readings.update({key: float(value) for key, value in values.items()})
        drafts = build_month_charges(state, apartment_id, month, current_readings)
        with self.connect() as connection:
            connection.execute(
                "DELETE FROM charges WHERE apartment_id = ? AND month = ?",
                (apartment_id, month),
            )
            connection.execute(
                "DELETE FROM payments WHERE apartment_id = ? AND month = ?",
                (apartment_id, month),
            )
            total = 0.0
            for draft in drafts:
                total += draft.amount
                connection.execute(
                    """
                    INSERT INTO charges (
                        id, apartment_id, month, service_id, amount, consumption, formula_snapshot
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        new_id("charge"),
                        apartment_id,
                        month,
                        draft.service_id,
                        draft.amount,
                        draft.consumption,
                        draft.formula_snapshot,
                    ),
                )
            connection.execute(
                """
                INSERT INTO payments (id, apartment_id, month, amount, paid_at, status)
                VALUES (?, ?, ?, ?, NULL, 'pending')
                """,
                (new_id("pay"), apartment_id, month, round_money(total)),
            )
            connection.commit()

    def mark_paid(self, telegram_id: int, apartment_id: str, month: str, paid_at: str) -> None:
        self._owned_apartment(telegram_id, apartment_id)
        with self.connect() as connection:
            total_row = connection.execute(
                "SELECT COALESCE(SUM(amount), 0) AS total FROM charges WHERE apartment_id = ? AND month = ?",
                (apartment_id, month),
            ).fetchone()
            amount = float(total_row["total"])
            existing = connection.execute(
                "SELECT id FROM payments WHERE apartment_id = ? AND month = ?",
                (apartment_id, month),
            ).fetchone()
            if existing:
                connection.execute(
                    """
                    UPDATE payments
                    SET status = 'paid', paid_at = ?, amount = ?
                    WHERE apartment_id = ? AND month = ?
                    """,
                    (paid_at, amount, apartment_id, month),
                )
            else:
                connection.execute(
                    """
                    INSERT INTO payments (id, apartment_id, month, amount, paid_at, status)
                    VALUES (?, ?, ?, ?, ?, 'paid')
                    """,
                    (f"pay-{apartment_id}-{month}", apartment_id, month, amount, paid_at),
                )
            connection.commit()

    def update_notifications(self, telegram_id: int, patch: dict) -> None:
        mapping = {
            "readingsEnabled": "readings_enabled",
            "readingsDaysBefore": "readings_days_before",
            "paymentEnabled": "payment_enabled",
            "paymentDaysBefore": "payment_days_before",
            "reportEnabled": "report_enabled",
            "reportDay": "report_day",
        }
        assignments = []
        values: list = []
        for key, column in mapping.items():
            if key in patch:
                value = patch[key]
                if isinstance(value, bool):
                    value = 1 if value else 0
                assignments.append(f"{column} = ?")
                values.append(value)
        if not assignments:
            return
        values.append(telegram_id)
        with self.connect() as connection:
            connection.execute(
                f"UPDATE users SET {', '.join(assignments)} WHERE telegram_id = ?",
                values,
            )
            connection.commit()

    def _active_apartment(self, telegram_id: int) -> str:
        with self.connect() as connection:
            row = connection.execute(
                "SELECT active_apartment_id FROM users WHERE telegram_id = ?",
                (telegram_id,),
            ).fetchone()
        if row is None or not row["active_apartment_id"]:
            raise ValueError("No active apartment")
        return row["active_apartment_id"]

    def _owned_apartment(self, telegram_id: int, apartment_id: str) -> None:
        with self.connect() as connection:
            row = connection.execute(
                "SELECT id FROM apartments WHERE id = ? AND telegram_id = ?",
                (apartment_id, telegram_id),
            ).fetchone()
        if row is None:
            raise PermissionError("Apartment not found")

    def _assert_meters_owned(self, telegram_id: int, meter_ids: list[str]) -> None:
        if not meter_ids:
            return
        with self.connect() as connection:
            placeholders = ",".join("?" for _ in meter_ids)
            rows_found = connection.execute(
                f"""
                SELECT meters.id FROM meters
                JOIN services ON services.id = meters.service_id
                JOIN apartments ON apartments.id = services.apartment_id
                WHERE meters.id IN ({placeholders}) AND apartments.telegram_id = ?
                """,
                [*meter_ids, telegram_id],
            ).fetchall()
        if len(rows_found) != len(set(meter_ids)):
            raise PermissionError("Meter does not belong to this user")


def rows(cursor: sqlite3.Cursor) -> list[sqlite3.Row]:
    return list(cursor.fetchall())


def to_float(value) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def empty_state(display_name: str) -> dict:
    return {
        "onboarded": False,
        "displayName": display_name,
        "apartments": [],
        "activeApartmentId": None,
        "services": [],
        "meters": [],
        "readings": [],
        "charges": [],
        "payments": [],
        "notifications": {
            "readingsEnabled": True,
            "readingsDaysBefore": 3,
            "paymentEnabled": True,
            "paymentDaysBefore": 2,
            "reportEnabled": True,
            "reportDay": 1,
        },
    }


def last_reading_before(state: dict, meter_id: str, month: str) -> float | None:
    previous = [
        item
        for item in state["readings"]
        if item["meterId"] == meter_id and item["month"] < month
    ]
    previous.sort(key=lambda item: item["month"], reverse=True)
    if not previous:
        return None
    return float(previous[0]["value"])


def build_month_charges(
    state: dict,
    apartment_id: str,
    month: str,
    current_readings: dict[str, float],
) -> list[ChargeDraft]:
    apartment = next((item for item in state["apartments"] if item["id"] == apartment_id), None)
    drafts: list[ChargeDraft] = []
    services = [
        item
        for item in state["services"]
        if item["apartmentId"] == apartment_id and item["isActive"]
    ]

    for service in services:
        calc_type = service["calcType"]
        if calc_type == "fixed":
            drafts.append(
                ChargeDraft(
                    service_id=service["id"],
                    amount=compute_fixed_amount(service["tariff"]),
                    consumption=None,
                    formula_snapshot=describe_formula("fixed", {"tariff": service["tariff"]}),
                )
            )
            continue
        if calc_type == "by_area":
            area = float(apartment["areaM2"] or 0) if apartment else 0
            drafts.append(
                ChargeDraft(
                    service_id=service["id"],
                    amount=compute_by_area_amount(area, service["tariff"]),
                    consumption=area,
                    formula_snapshot=describe_formula(
                        "by_area",
                        {"tariff": service["tariff"], "area_m2": area},
                    ),
                )
            )
            continue

        meters = [item for item in state["meters"] if item["serviceId"] == service["id"]]
        if calc_type == "two_zone":
            day_meter = next((item for item in meters if item["zone"] == "day"), None)
            night_meter = next((item for item in meters if item["zone"] == "night"), None)
            if day_meter is None or night_meter is None:
                continue
            day_previous = last_reading_before(state, day_meter["id"], month)
            night_previous = last_reading_before(state, night_meter["id"], month)
            day_current = current_readings.get(day_meter["id"])
            night_current = current_readings.get(night_meter["id"])
            if None in (day_previous, night_previous, day_current, night_current):
                continue
            day_use = compute_consumption(float(day_current), float(day_previous))
            night_use = compute_consumption(float(night_current), float(night_previous))
            drafts.append(
                ChargeDraft(
                    service_id=service["id"],
                    amount=compute_two_zone_amount(
                        day_use,
                        service["tariff"],
                        night_use,
                        float(service.get("nightTariff") or 0),
                    ),
                    consumption=round_money(day_use + night_use),
                    formula_snapshot=describe_formula(
                        "two_zone",
                        {
                            "consumption": day_use,
                            "night_consumption": night_use,
                            "tariff": service["tariff"],
                            "night_tariff": service.get("nightTariff") or 0,
                        },
                    ),
                )
            )
            continue

        meter = meters[0] if meters else None
        if meter is None:
            continue
        previous = last_reading_before(state, meter["id"], month)
        current = current_readings.get(meter["id"])
        if previous is None or current is None:
            continue
        consumption = compute_consumption(float(current), float(previous))
        drafts.append(
            ChargeDraft(
                service_id=service["id"],
                amount=compute_metered_amount(consumption, service["tariff"]),
                consumption=consumption,
                formula_snapshot=describe_formula(
                    "metered",
                    {
                        "consumption": consumption,
                        "tariff": service["tariff"],
                        "unit": service["unit"],
                    },
                ),
            )
        )
    return drafts
