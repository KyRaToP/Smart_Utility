from __future__ import annotations

from aiogram.types import KeyboardButton, ReplyKeyboardMarkup

CLEAR_BUTTON = "Очистить базу"


def composer_keyboard() -> ReplyKeyboardMarkup:
    """Persistent bar above the input with wipe action only."""
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=CLEAR_BUTTON)]],
        resize_keyboard=True,
        is_persistent=True,
        input_field_placeholder="Напишите да или нет, если бот спросил",
    )
