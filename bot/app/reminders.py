from __future__ import annotations

from calendar import monthrange
from dataclasses import dataclass
from datetime import date, datetime
from zoneinfo import ZoneInfo

from .config import ALLOWED_IDS, DATABASE_PATH, TIMEZONE
from .db_reader import (
    ApartmentRow,
    UserRow,
    list_apartments,
    list_users,
    month_total,
    payment_status,
)

MONTHS_RU = [
    "",
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
]


@dataclass
class ReminderMessage:
    telegram_id: int
    text: str


def clamp_day(year: int, month: int, day: int) -> int:
    last = monthrange(year, month)[1]
    return max(1, min(day, last))


def previous_month_key(today: date) -> str:
    if today.month == 1:
        return f"{today.year - 1}-12"
    return f"{today.year}-{today.month - 1:02d}"


def current_month_key(today: date) -> str:
    return f"{today.year}-{today.month:02d}"


def format_money(amount: float) -> str:
    if abs(amount - round(amount)) < 0.005:
        return f"{int(round(amount)):,}".replace(",", " ") + " ₽"
    return f"{amount:,.2f}".replace(",", " ").replace(".", ",") + " ₽"


def today_in_bot_timezone() -> date:
    try:
        zone = ZoneInfo(TIMEZONE)
    except Exception:
        zone = ZoneInfo("Europe/Moscow")
    return datetime.now(zone).date()


def build_reminders_for_today(today: date | None = None) -> list[ReminderMessage]:
    today = today or today_in_bot_timezone()
    messages: list[ReminderMessage] = []
    for user in list_users(DATABASE_PATH):
        if user.telegram_id not in ALLOWED_IDS:
            continue
        messages.extend(build_user_reminders(user, today))
    return messages


def build_user_reminders(user: UserRow, today: date) -> list[ReminderMessage]:
    apartments = list_apartments(DATABASE_PATH, user.telegram_id)
    if not apartments:
        return []

    messages: list[ReminderMessage] = []
    reading_names = apartments_due_for_readings(user, apartments, today)
    payment_names = apartments_due_for_payment(user, apartments, today)

    if reading_names:
        names = "\n".join(f"• {name}" for name in reading_names)
        messages.append(
            ReminderMessage(
                telegram_id=user.telegram_id,
                text=(
                    f"Пора передать показания\n\n"
                    f"Квартиры:\n{names}\n\n"
                    f"Откройте приложение и введите только текущие значения."
                ),
            )
        )

    if payment_names:
        names = "\n".join(f"• {name}" for name in payment_names)
        messages.append(
            ReminderMessage(
                telegram_id=user.telegram_id,
                text=(
                    f"Напоминание об оплате\n\n"
                    f"Проверьте счета:\n{names}\n\n"
                    f"После оплаты отметьте месяц как оплаченный в приложении."
                ),
            )
        )

    if user.report_enabled and today.day == clamp_day(today.year, today.month, user.report_day):
        report = build_monthly_report(user, apartments, today)
        if report:
            messages.append(ReminderMessage(telegram_id=user.telegram_id, text=report))

    return messages


def apartments_due_for_readings(
    user: UserRow,
    apartments: list[ApartmentRow],
    today: date,
) -> list[str]:
    if not user.readings_enabled:
        return []
    names: list[str] = []
    for apartment in apartments:
        remind_day = clamp_day(
            today.year,
            today.month,
            apartment.reading_due_day - user.readings_days_before,
        )
        if today.day == remind_day:
            names.append(f"{apartment.name} — срок показаний {apartment.reading_due_day} число")
    return names


def apartments_due_for_payment(
    user: UserRow,
    apartments: list[ApartmentRow],
    today: date,
) -> list[str]:
    if not user.payment_enabled:
        return []
    month = current_month_key(today)
    names: list[str] = []
    for apartment in apartments:
        remind_day = clamp_day(
            today.year,
            today.month,
            apartment.reading_due_day - user.payment_days_before,
        )
        if today.day != remind_day:
            continue
        status = payment_status(DATABASE_PATH, apartment.id, month)
        total = month_total(DATABASE_PATH, apartment.id, month)
        if status == "paid":
            continue
        if total <= 0 and status is None:
            names.append(f"{apartment.name} — сохраните расчёт за месяц")
            continue
        label = "ожидает оплаты" if status == "pending" else "есть начисление"
        if status == "overdue":
            label = "просрочено"
        names.append(f"{apartment.name} — {format_money(total)}, {label}")
    return names


def build_monthly_report(
    user: UserRow,
    apartments: list[ApartmentRow],
    today: date,
) -> str | None:
    month = previous_month_key(today)
    year, month_num = month.split("-")
    title = f"Отчёт за {MONTHS_RU[int(month_num)]} {year}"
    lines: list[str] = []
    grand = 0.0
    for apartment in apartments:
        total = month_total(DATABASE_PATH, apartment.id, month)
        status = payment_status(DATABASE_PATH, apartment.id, month)
        status_text = {
            "paid": "оплачено",
            "pending": "ожидает оплаты",
            "overdue": "просрочено",
        }.get(status or "", "нет расчёта")
        grand += total
        lines.append(f"• {apartment.name}: {format_money(total)} — {status_text}")

    if grand <= 0 and all(
        payment_status(DATABASE_PATH, item.id, month) is None for item in apartments
    ):
        return (
            f"{title}\n\n"
            f"Пока нет сохранённых расчётов за этот месяц.\n"
            f"Когда появятся — отчёт придёт автоматически."
        )

    return (
        f"{title}\n\n"
        + "\n".join(lines)
        + f"\n\nИтого по трём квартирам: {format_money(grand)}"
    )
