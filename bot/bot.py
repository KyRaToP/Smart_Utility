"""
Smart_Utility Telegram bot.

Opens Mini App, answers /start, sends daily reminders from SQLite settings.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import date

from aiogram import Bot, Dispatcher, F, Router
from aiogram.filters import Command, CommandStart
from aiogram.types import Message

from app.config import ALLOWED_IDS, BOT_TOKEN, DATABASE_PATH, WEBAPP_URL, is_allowed
from app.db_reader import list_users
from app.db_wipe import wipe_user_data
from app.keyboards import CLEAR_BUTTON, composer_keyboard
from app.reminders import build_user_reminders
from app.scheduler import send_reminder, start_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

if not BOT_TOKEN:
    raise ValueError(
        "BOT_TOKEN пуст. Локально: заполните .env в корне проекта. "
        "На Railway: Variables → BOT_TOKEN = токен от BotFather "
        "(файл .env в облако не копируется)."
    )

router = Router()
pending_wipe: set[int] = set()

WIPE_CONFIRM = (
    "Это удалит все ваши данные Smart_Utility: квартиры, услуги, "
    "показания, расчёты и отметки оплаты.\n\n"
    "После очистки нужно заново открыть приложение и пройти onboarding.\n\n"
    "Напишите да — удалить, или нет — отменить."
)


def start_text() -> str:
    return (
        "Smart_Utility — учёт коммуналки по трём квартирам.\n\n"
        "Данные только ваши: названия, тарифы и показания вы вводите сами. "
        "Разработчик их не заполняет.\n\n"
        "С чего начать:\n"
        "1. Откройте приложение (кнопка «Приложение»)\n"
        "2. Назовите три квартиры\n"
        "3. Добавьте услуги и тарифы с квитанции\n"
        "4. Если месяц уже оплачен — внесите конечные показания как базу\n"
        "5. Дальше каждый месяц: новые показания → расчёт → отметьте оплату\n\n"
        "Важно: через приложение деньги не списываются. "
        "Кнопка «Отметить оплаченным» — только запись в учёте после оплаты снаружи.\n\n"
        "Бот напомнит о сроках (Настройки → Уведомления).\n"
        "Кнопка «Очистить базу» удаляет все ваши данные после подтверждения да/нет."
    )


def help_text() -> str:
    return (
        "Краткая справка Smart_Utility\n\n"
        "• Три квартиры — отдельные услуги, показания и суммы.\n"
        "• Показания: расход = текущие − предыдущие.\n"
        "• Первый запуск: можно сохранить уже оплаченный месяц как базу "
        "(Настройки → Уже оплаченный месяц).\n"
        "• Расчёт показывает формулы; сохраните месяц, затем отметьте оплату.\n"
        "• Оплата картой / СБП в приложении нет — только статус «оплачено».\n"
        "• Напоминания: /remind_test — проверить сегодняшние (для разработчика).\n"
        "• Очистить базу — кнопка под полем ввода. Бот спросит, напишите да или нет.\n\n"
        "Команды: /start — приветствие, /help — справка, /wipe — очистка данных."
    )


def normalize_reply(text: str | None) -> str:
    return (text or "").strip().casefold()


async def answer_with_bar(message: Message, text: str) -> None:
    await message.answer(text, reply_markup=composer_keyboard())


@router.message(CommandStart())
async def start(message: Message) -> None:
    user = message.from_user
    if user is None:
        return

    pending_wipe.discard(user.id)

    if not is_allowed(user.id):
        await message.answer(
            "Этот бот приватный. Если вы владелец квартир, попросите "
            "разработчика добавить ваш Telegram ID в список доступа."
        )
        return

    text = start_text()
    if not WEBAPP_URL:
        await message.answer(
            text
            + "\n\nПриложение ещё не подключено: нужна публичная HTTPS-ссылка "
            "(WEBAPP_URL). Пока можно пользоваться локальной версией у разработчика.",
            reply_markup=composer_keyboard(),
        )
        return

    await answer_with_bar(message, text)


@router.message(Command("help"))
async def help_command(message: Message) -> None:
    user = message.from_user
    if user is None:
        return
    if not is_allowed(user.id):
        await message.answer("Нет доступа.")
        return

    pending_wipe.discard(user.id)
    await answer_with_bar(message, help_text())


@router.message(Command("wipe"))
@router.message(F.text == CLEAR_BUTTON)
async def ask_wipe(message: Message) -> None:
    user = message.from_user
    if user is None:
        return
    if not is_allowed(user.id):
        await message.answer("Нет доступа.")
        return

    pending_wipe.add(user.id)
    await message.answer(WIPE_CONFIRM, reply_markup=composer_keyboard())


@router.message(Command("remind_test"))
async def remind_test(message: Message) -> None:
    """Send today's reminders for the current user (local testing)."""
    user = message.from_user
    if user is None:
        return
    if not is_allowed(user.id):
        await message.answer("Нет доступа.")
        return

    pending_wipe.discard(user.id)

    profile = next(
        (item for item in list_users(DATABASE_PATH) if item.telegram_id == user.id),
        None,
    )
    if profile is None:
        await message.answer(
            "В базе ещё нет onboarded-профиля с вашим telegram_id.\n"
            "Откройте Mini App в режиме «как у пользователя», пройдите "
            "onboarding (API должен быть запущен), затем повторите /remind_test.",
            reply_markup=composer_keyboard(),
        )
        return

    reminders = build_user_reminders(profile, date.today())
    if not reminders:
        await message.answer(
            "На сегодня по вашим настройкам напоминаний нет.\n"
            "Проверьте день показаний квартиры и «за N дней» в Уведомлениях, "
            "либо смените дату на ПК для теста логики.",
            reply_markup=composer_keyboard(),
        )
        return

    bot = message.bot
    for reminder in reminders:
        await send_reminder(bot, reminder)
    await message.answer(
        f"Отправлено напоминаний: {len(reminders)}",
        reply_markup=composer_keyboard(),
    )


@router.message(F.text)
async def wipe_confirmation(message: Message) -> None:
    user = message.from_user
    if user is None or user.id not in pending_wipe:
        return
    if not is_allowed(user.id):
        pending_wipe.discard(user.id)
        await message.answer("Нет доступа.")
        return

    reply = normalize_reply(message.text)
    if reply == "да":
        pending_wipe.discard(user.id)
        wipe_user_data(DATABASE_PATH, user.id)
        logger.info("User %s wiped their Smart_Utility data", user.id)
        await message.answer(
            "База очищена. Откройте приложение и заново укажите квартиры.",
            reply_markup=composer_keyboard(),
        )
        return

    if reply == "нет":
        pending_wipe.discard(user.id)
        await message.answer(
            "Отменено. Данные на месте.",
            reply_markup=composer_keyboard(),
        )
        return

    await message.answer(
        "Нужен ответ да или нет. Другой текст не подходит.",
        reply_markup=composer_keyboard(),
    )


async def setup_menu(bot: Bot) -> None:
    from aiogram.types import BotCommand, MenuButtonWebApp, WebAppInfo

    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Приветствие"),
            BotCommand(command="help", description="Справка"),
            BotCommand(command="wipe", description="Очистить все данные"),
        ]
    )
    if not WEBAPP_URL:
        logger.warning("WEBAPP_URL is empty — Menu Button Web App is not set")
        return

    await bot.set_chat_menu_button(
        menu_button=MenuButtonWebApp(
            text="Приложение",
            web_app=WebAppInfo(url=WEBAPP_URL),
        )
    )


async def main() -> None:
    if not ALLOWED_IDS:
        logger.error(
            "ALLOWED_TELEGRAM_IDS is empty — bot will reject all users until IDs are set"
        )
    bot = Bot(token=BOT_TOKEN)
    dispatcher = Dispatcher()
    dispatcher.include_router(router)
    await setup_menu(bot)
    start_scheduler(bot)
    logger.info("Bot started (WEBAPP_URL=%s)", WEBAPP_URL or "(empty)")
    try:
        await dispatcher.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
