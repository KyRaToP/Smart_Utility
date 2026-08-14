from __future__ import annotations

from datetime import date
from pathlib import Path

from app.db_reader import UserRow
from app.reminders import (
    apartments_due_for_readings,
    build_monthly_report,
    clamp_day,
    previous_month_key,
)
from app.db_reader import ApartmentRow


def test_clamp_day() -> None:
    assert clamp_day(2026, 2, 31) == 28
    assert clamp_day(2026, 8, 0) == 1
    assert clamp_day(2026, 8, 25) == 25


def test_previous_month_key() -> None:
    assert previous_month_key(date(2026, 8, 14)) == "2026-07"
    assert previous_month_key(date(2026, 1, 5)) == "2025-12"


def test_readings_due_logic() -> None:
    user = UserRow(
        telegram_id=1,
        display_name="Test",
        onboarded=True,
        readings_enabled=True,
        readings_days_before=3,
        payment_enabled=True,
        payment_days_before=2,
        report_enabled=True,
        report_day=1,
    )
    apartments = [
        ApartmentRow(id="a1", telegram_id=1, name="Дом", reading_due_day=25),
    ]
    names = apartments_due_for_readings(user, apartments, date(2026, 8, 22))
    assert names and "Дом" in names[0]
    assert apartments_due_for_readings(user, apartments, date(2026, 8, 21)) == []


def test_report_empty_without_db(tmp_path: Path, monkeypatch) -> None:
    import app.reminders as reminders_mod

    monkeypatch.setattr(reminders_mod, "DATABASE_PATH", tmp_path / "missing.db")
    user = UserRow(
        telegram_id=1,
        display_name="Test",
        onboarded=True,
        readings_enabled=True,
        readings_days_before=3,
        payment_enabled=True,
        payment_days_before=2,
        report_enabled=True,
        report_day=1,
    )
    apartments = [
        ApartmentRow(id="a1", telegram_id=1, name="Дом", reading_due_day=25),
    ]
    text = build_monthly_report(user, apartments, date(2026, 8, 1))
    assert text is not None
    assert "Отчёт" in text
