from __future__ import annotations

import logging

from aiogram import Bot
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .config import REMINDER_HOUR, REMINDER_MINUTE, TIMEZONE, WEBAPP_URL
from .reminders import ReminderMessage, build_reminders_for_today

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone=TIMEZONE)


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


async def send_reminder(bot: Bot, reminder: ReminderMessage) -> None:
    keyboard = app_keyboard()
    if keyboard:
        await bot.send_message(
            chat_id=reminder.telegram_id,
            text=reminder.text,
            reply_markup=keyboard,
        )
    else:
        await bot.send_message(chat_id=reminder.telegram_id, text=reminder.text)
    logger.info("Reminder sent to %s", reminder.telegram_id)


async def run_daily_reminders(bot: Bot) -> None:
    reminders = build_reminders_for_today()
    logger.info("Daily reminders to send: %s", len(reminders))
    for reminder in reminders:
        try:
            await send_reminder(bot, reminder)
        except Exception:
            logger.exception("Failed to send reminder to %s", reminder.telegram_id)


def start_scheduler(bot: Bot) -> None:
    if scheduler.running:
        return
    scheduler.add_job(
        run_daily_reminders,
        trigger="cron",
        hour=REMINDER_HOUR,
        minute=REMINDER_MINUTE,
        args=[bot],
        id="daily_utility_reminders",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Scheduler started (%s) daily at %02d:%02d",
        TIMEZONE,
        REMINDER_HOUR,
        REMINDER_MINUTE,
    )
