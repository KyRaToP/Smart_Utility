from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from pathlib import Path


@dataclass
class UserRow:
    telegram_id: int
    display_name: str
    onboarded: bool
    readings_enabled: bool
    readings_days_before: int
    payment_enabled: bool
    payment_days_before: int
    report_enabled: bool
    report_day: int


@dataclass
class ApartmentRow:
    id: str
    telegram_id: int
    name: str
    reading_due_day: int


def connect(db_path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection


def list_users(db_path: Path) -> list[UserRow]:
    if not db_path.exists():
        return []
    with connect(db_path) as connection:
        rows = connection.execute(
            """
            SELECT telegram_id, display_name, onboarded,
                   readings_enabled, readings_days_before,
                   payment_enabled, payment_days_before,
                   report_enabled, report_day
            FROM users
            WHERE onboarded = 1
            """
        ).fetchall()
    return [
        UserRow(
            telegram_id=row["telegram_id"],
            display_name=row["display_name"] or "пользователь",
            onboarded=bool(row["onboarded"]),
            readings_enabled=bool(row["readings_enabled"]),
            readings_days_before=int(row["readings_days_before"] or 0),
            payment_enabled=bool(row["payment_enabled"]),
            payment_days_before=int(row["payment_days_before"] or 0),
            report_enabled=bool(row["report_enabled"]),
            report_day=int(row["report_day"] or 1),
        )
        for row in rows
    ]


def list_apartments(db_path: Path, telegram_id: int) -> list[ApartmentRow]:
    if not db_path.exists():
        return []
    with connect(db_path) as connection:
        rows = connection.execute(
            """
            SELECT id, telegram_id, name, reading_due_day
            FROM apartments
            WHERE telegram_id = ?
            ORDER BY name
            """,
            (telegram_id,),
        ).fetchall()
    return [
        ApartmentRow(
            id=row["id"],
            telegram_id=row["telegram_id"],
            name=row["name"],
            reading_due_day=int(row["reading_due_day"] or 25),
        )
        for row in rows
    ]


def month_total(db_path: Path, apartment_id: str, month: str) -> float:
    if not db_path.exists():
        return 0.0
    with connect(db_path) as connection:
        row = connection.execute(
            """
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM charges
            WHERE apartment_id = ? AND month = ?
            """,
            (apartment_id, month),
        ).fetchone()
    return float(row["total"] if row else 0)


def payment_status(db_path: Path, apartment_id: str, month: str) -> str | None:
    if not db_path.exists():
        return None
    with connect(db_path) as connection:
        row = connection.execute(
            """
            SELECT status FROM payments
            WHERE apartment_id = ? AND month = ?
            """,
            (apartment_id, month),
        ).fetchone()
    return row["status"] if row else None
