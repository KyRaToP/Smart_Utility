from __future__ import annotations

import hashlib
import hmac
import json
import os
from urllib.parse import parse_qsl

from fastapi import Header, HTTPException


class AuthError(Exception):
    pass


def _allowed_ids() -> set[int]:
    raw = os.getenv("ALLOWED_TELEGRAM_IDS", "")
    return {
        int(item.strip())
        for item in raw.split(",")
        if item.strip().isdigit()
    }


def bot_token() -> str:
    return os.getenv("BOT_TOKEN", "").strip()


def dev_auth_enabled() -> bool:
    flag = os.getenv("DEV_AUTH", "").strip().lower()
    if flag in {"1", "true", "yes"}:
        return True
    if flag in {"0", "false", "no"}:
        return False
    return bot_token() == ""


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

    user_raw = parsed.get("user", "")
    if not user_raw:
        raise AuthError("initData has no user")
    return json.loads(user_raw)


def resolve_user(
    x_telegram_init_data: str | None = Header(default=None),
    x_dev_telegram_id: str | None = Header(default=None),
) -> dict:
    token = bot_token()
    if x_telegram_init_data:
        if not token:
            raise HTTPException(
                status_code=503,
                detail="BOT_TOKEN is empty, cannot verify Telegram initData",
            )
        try:
            user = validate_init_data(x_telegram_init_data, token)
        except AuthError as error:
            raise HTTPException(status_code=401, detail=str(error)) from error
        telegram_id = int(user["id"])
        _assert_allowlist(telegram_id)
        return {
            "telegram_id": telegram_id,
            "display_name": user.get("first_name") or "Пользователь",
        }

    if dev_auth_enabled():
        telegram_id = int(x_dev_telegram_id or os.getenv("DEV_TELEGRAM_ID", "1001"))
        _assert_allowlist(telegram_id)
        return {"telegram_id": telegram_id, "display_name": "Dev"}

    raise HTTPException(
        status_code=401,
        detail="Telegram initData is required",
    )


def _assert_allowlist(telegram_id: int) -> None:
    allowed = _allowed_ids()
    if not allowed:
        return
    if telegram_id not in allowed:
        raise HTTPException(status_code=403, detail="This bot is private")
