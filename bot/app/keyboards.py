from __future__ import annotations

from aiogram.types import KeyboardButton, ReplyKeyboardMarkup, WebAppInfo

from .config import WEBAPP_URL

CLEAR_BUTTON = "Очистить базу"


def composer_keyboard() -> ReplyKeyboardMarkup:
    """Persistent bar above the input: Mini App + wipe, side by side."""
    row: list[KeyboardButton] = []
    if WEBAPP_URL:
        row.append(
            KeyboardButton(
                text="Приложение",
                web_app=WebAppInfo(url=WEBAPP_URL),
            )
        )
    row.append(KeyboardButton(text=CLEAR_BUTTON))
    return ReplyKeyboardMarkup(
        keyboard=[row],
        resize_keyboard=True,
        is_persistent=True,
        input_field_placeholder="Напишите да или нет, если бот спросил",
    )
