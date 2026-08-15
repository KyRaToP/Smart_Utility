from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip()
DATABASE_PATH = Path(
    os.getenv("DATABASE_PATH", PROJECT_ROOT / "api" / "data" / "smart_utility.db")
)
TIMEZONE = os.getenv("BOT_TIMEZONE", "Europe/Moscow")
REMINDER_HOUR = int(os.getenv("REMINDER_HOUR", "9"))
REMINDER_MINUTE = int(os.getenv("REMINDER_MINUTE", "0"))

ALLOWED_IDS = {
    int(item.strip())
    for item in os.getenv("ALLOWED_TELEGRAM_IDS", "").split(",")
    if item.strip().isdigit()
}


def is_allowed(user_id: int) -> bool:
    # Variant B: empty allowlist means nobody (not "everyone").
    if not ALLOWED_IDS:
        return False
    return user_id in ALLOWED_IDS
