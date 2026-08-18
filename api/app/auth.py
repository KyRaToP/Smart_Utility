from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from urllib.parse import parse_qsl

from fastapi import Header, HTTPException, Request


class AuthError(Exception):
    pass


# Default max age for Telegram WebApp initData (24 hours).
DEFAULT_AUTH_DATE_MAX_AGE_SECONDS = 86400


def _allowed_ids() -> set[int]:
    raw = os.getenv("ALLOWED_TELEGRAM_IDS", "")
    return {
        int(item.strip())
        for item in raw.split(",")
        if item.strip().isdigit()
    }


def bot_token() -> str:
    return os.getenv("BOT_TOKEN", "").strip()


def auth_date_max_age_seconds() -> int:
    raw = os.getenv("AUTH_DATE_MAX_AGE_SECONDS", str(DEFAULT_AUTH_DATE_MAX_AGE_SECONDS))
    try:
        value = int(raw.strip())
    except ValueError:
        return DEFAULT_AUTH_DATE_MAX_AGE_SECONDS
    return value if value > 0 else DEFAULT_AUTH_DATE_MAX_AGE_SECONDS


def railway_detected() -> bool:
    """True when running on Railway — DEV auth must never apply there."""
    return bool(
        os.getenv("RAILWAY_PUBLIC_DOMAIN", "").strip()
        or os.getenv("RAILWAY_ENVIRONMENT", "").strip()
    )


def dev_auth_enabled() -> bool:
    # Default OFF. DEV_AUTH=1 is for local browser testing only.
    # Railway always disables the unsigned path even if someone sets DEV_AUTH=1.
    if railway_detected():
        return False
    flag = os.getenv("DEV_AUTH", "0").strip().lower()
    if flag in {"1", "true", "yes"}:
        return True
    if flag in {"0", "false", "no"}:
        return False
    return False


def validate_init_data(init_data: str, token: str) -> dict:
    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", "")
    if not received_hash or not token:
        raise AuthError("initData hash is missing")

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", token.encode("utf-8"), hashlib.sha256).digest()
    calculated = hmac.new(
        secret_key,
        data_check_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(calculated, received_hash):
        raise AuthError("initData signature is invalid")

    _assert_auth_date(parsed)

    user_raw = parsed.get("user", "")
    if not user_raw:
        raise AuthError("initData has no user")
    return json.loads(user_raw)


def _assert_auth_date(parsed: dict) -> None:
    raw = parsed.get("auth_date", "")
    if not raw:
        raise AuthError("initData auth_date is missing")
    try:
        auth_date = int(raw)
    except ValueError as error:
        raise AuthError("initData auth_date is invalid") from error

    now = int(time.time())
    # Allow small clock skew between Telegram and the server.
    if auth_date > now + 60:
        raise AuthError("initData auth_date is in the future")
    if now - auth_date > auth_date_max_age_seconds():
        raise AuthError("initData has expired")


def resolve_user(
    request: Request,
    x_telegram_init_data: str | None = Header(default=None),
    x_dev_telegram_id: str | None = Header(default=None),
) -> dict:
    token = bot_token()
    init_data = (x_telegram_init_data or "").strip()

    # Local browser / Vite proxy: no Telegram signature.
    # Only when DEV_AUTH=1 and we are not on Railway. Loopback alone is not enough.
    if dev_auth_enabled() and not init_data:
        try:
            telegram_id = int(x_dev_telegram_id or os.getenv("DEV_TELEGRAM_ID", "1001"))
        except ValueError as error:
            raise HTTPException(status_code=400, detail="Invalid DEV telegram id") from error
        return {"telegram_id": telegram_id, "display_name": "Dev"}

    if init_data:
        if not token:
            raise HTTPException(
                status_code=503,
                detail="BOT_TOKEN is empty, cannot verify Telegram initData",
            )
        try:
            user = validate_init_data(init_data, token)
        except AuthError as error:
            raise HTTPException(status_code=401, detail=str(error)) from error
        telegram_id = int(user["id"])
        _assert_allowlist(telegram_id)
        return {
            "telegram_id": telegram_id,
            "display_name": user.get("first_name") or "Пользователь",
        }

    raise HTTPException(
        status_code=401,
        detail="Telegram initData is required (or enable DEV_AUTH=1 for local browser)",
    )


def _assert_allowlist(telegram_id: int) -> None:
    """Variant B: empty allowlist is not open access — reject until IDs are set."""
    allowed = _allowed_ids()
    if not allowed:
        raise HTTPException(
            status_code=503,
            detail="ALLOWED_TELEGRAM_IDS is empty; set at least one Telegram ID",
        )
    if telegram_id not in allowed:
        raise HTTPException(status_code=403, detail="This bot is private")
