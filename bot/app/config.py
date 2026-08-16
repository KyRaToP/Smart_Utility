from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
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


def resolve_webapp_url() -> str:
    """Public Mini App URL for Telegram Menu Button / WebApp buttons.

    On Railway, ignore a stuck GitHub Pages WEBAPP_URL when RAILWAY_PUBLIC_DOMAIN
    is present — otherwise the bot keeps rewriting BotFather back to Pages.
    """
    raw = os.getenv("WEBAPP_URL", "").strip().rstrip("/")
    railway = os.getenv("RAILWAY_PUBLIC_DOMAIN", "").strip().rstrip("/")
    if railway and (not raw or "github.io" in raw.lower()):
        return f"https://{railway}"
    if raw:
        return raw
    if railway:
        return f"https://{railway}"
    return ""


WEBAPP_URL = resolve_webapp_url()


def is_allowed(user_id: int) -> bool:
    # Variant B: empty allowlist means nobody (not "everyone").
    if not ALLOWED_IDS:
        return False
    return user_id in ALLOWED_IDS
