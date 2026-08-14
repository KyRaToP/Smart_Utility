import asyncio
import logging
import os
from pathlib import Path

from aiogram import Bot, Dispatcher, Router
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
if not BOT_TOKEN:
    raise ValueError(
        "BOT_TOKEN пуст. Откройте .env в корне проекта и вставьте токен от BotFather."
    )

WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip()
ALLOWED_IDS = {
    int(item.strip())
    for item in os.environ.get("ALLOWED_TELEGRAM_IDS", "").split(",")
    if item.strip().isdigit()
}

if not ALLOWED_IDS:
    logger.warning(
        "ALLOWED_TELEGRAM_IDS пуст: бот отвечает всем. Перед передачей пользователю задайте allowlist."
    )

router = Router()


def is_allowed(user_id: int) -> bool:
    if not ALLOWED_IDS:
        return True
    return user_id in ALLOWED_IDS


def app_keyboard() -> InlineKeyboardMarkup | None:
    if not WEBAPP_URL:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть приложение",
                    web_app=WebAppInfo(url=WEBAPP_URL),
                )
            ]
        ]
    )


@router.message(CommandStart())
async def start(message: Message) -> None:
    user = message.from_user
    if user is None:
        return

    if not is_allowed(user.id):
        await message.answer(
            "Этот бот приватный. Если вы владелец квартир, попросите "
            "разработчика добавить ваш Telegram ID в allowlist."
        )
        return

    text = (
        "SMART UTILITY считает коммуналку по трём квартирам.\n\n"
        "Данные принадлежат только вам: названия квартир, тарифы и "
        "показания вы вводите сами.\n\n"
        "Как пользоваться:\n"
        "1. Откройте приложение\n"
        "2. Назовите три квартиры\n"
        "3. Добавьте услуги и тарифы из квитанции\n"
        "4. Каждый месяц введите текущие показания\n"
        "5. Сохраните расчёт и отметьте оплату"
    )

    keyboard = app_keyboard()
    if keyboard is None:
        await message.answer(
            text + "\n\nСсылка на Mini App ещё не задана (WEBAPP_URL)."
        )
        return

    await message.answer(text, reply_markup=keyboard)


@router.message(Command("help"))
async def help_command(message: Message) -> None:
    await start(message)


async def setup_menu(bot: Bot) -> None:
    if WEBAPP_URL:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="Приложение",
                web_app=WebAppInfo(url=WEBAPP_URL),
            )
        )


async def main() -> None:
    bot = Bot(token=BOT_TOKEN)
    dispatcher = Dispatcher()
    dispatcher.include_router(router)
    await setup_menu(bot)
    logger.info("Bot started")
    try:
        await dispatcher.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
