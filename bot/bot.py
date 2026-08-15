"""
Smart_Utility Telegram bot.

Opens Mini App, answers /start, sends daily reminders from SQLite settings.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import date

from aiogram import Bot, Dispatcher, Router
from aiogram.filters import Command, CommandStart
from aiogram.types import Message

from app.config import BOT_TOKEN, DATABASE_PATH, WEBAPP_URL, is_allowed
from app.db_reader import list_users
from app.reminders import build_user_reminders
from app.scheduler import app_keyboard, send_reminder, start_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

if not BOT_TOKEN:
    raise ValueError(
        "BOT_TOKEN пуст. Откройте .env в корне проекта и вставьте токен от BotFather."
    )

router = Router()


def start_text() -> str:
    return (
        "Smart_Utility — учёт коммуналки по трём квартирам.\n\n"
        "Данные только ваши: названия, тарифы и показания вы вводите сами. "
        "Разработчик их не заполняет.\n\n"
        "С чего начать:\n"
        "1. Откройте приложение (кнопка ниже или меню)\n"
        "2. Назовите три квартиры\n"
        "3. Добавьте услуги и тарифы с квитанции\n"
        "4. Если месяц уже оплачен — внесите конечные показания как базу\n"
        "5. Дальше каждый месяц: новые показания → расчёт → отметьте оплату\n\n"
        "Важно: через приложение деньги не списываются. "
        "Кнопка «Отметить оплаченным» — только запись в учёте после оплаты снаружи.\n\n"
        "Бот напомнит о сроках (Настройки → Уведомления)."
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
        "• Напоминания: /remind_test — проверить сегодняшние (для разработчика).\n\n"
        "Команды: /start — приветствие, /help — эта справка."
    )


@router.message(CommandStart())
async def start(message: Message) -> None:
    user = message.from_user
    if user is None:
        return

    if not is_allowed(user.id):
        await message.answer(
            "Этот бот приватный. Если вы владелец квартир, попросите "
            "разработчика добавить ваш Telegram ID в список доступа."
        )
        return

    text = start_text()
    keyboard = app_keyboard()
    if keyboard is None:
        await message.answer(
            text
            + "\n\nПриложение ещё не подключено: нужна публичная HTTPS-ссылка "
            "(WEBAPP_URL). Пока можно пользоваться локальной версией у разработчика."
        )
        return

    await message.answer(text, reply_markup=keyboard)


@router.message(Command("help"))
async def help_command(message: Message) -> None:
    user = message.from_user
    if user is None:
        return
    if not is_allowed(user.id):
        await message.answer("Нет доступа.")
        return

    keyboard = app_keyboard()
    if keyboard is None:
        await message.answer(help_text())
        return
    await message.answer(help_text(), reply_markup=keyboard)


@router.message(Command("remind_test"))
async def remind_test(message: Message) -> None:
    """Send today's reminders for the current user (local testing)."""
    user = message.from_user
    if user is None:
        return
    if not is_allowed(user.id):
        await message.answer("Нет доступа.")
        return

    profile = next(
        (item for item in list_users(DATABASE_PATH) if item.telegram_id == user.id),
        None,
    )
    if profile is None:
        # list_users only onboarded — try build with empty
        await message.answer(
            "В базе ещё нет onboarded-профиля с вашим telegram_id.\n"
            "Откройте Mini App в режиме «как у пользователя», пройдите "
            "onboarding (API должен быть запущен), затем повторите /remind_test."
        )
        return

    reminders = build_user_reminders(profile, date.today())
    if not reminders:
        await message.answer(
            "На сегодня по вашим настройкам напоминаний нет.\n"
            "Проверьте день показаний квартиры и «за N дней» в Уведомлениях, "
            "либо смените дату на ПК для теста логики."
        )
        return

    bot = message.bot
    for reminder in reminders:
        await send_reminder(bot, reminder)
    await message.answer(f"Отправлено напоминаний: {len(reminders)}")


async def setup_menu(bot: Bot) -> None:
    if not WEBAPP_URL:
        logger.warning("WEBAPP_URL is empty — Menu Button Web App is not set")
        return
    from aiogram.types import MenuButtonWebApp, WebAppInfo

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
    start_scheduler(bot)
    logger.info("Bot started")
    try:
        await dispatcher.start_polling(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
