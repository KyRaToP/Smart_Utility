# Telegram

**Language:** [English](#english) · [Русский](#русский)

<a id="english"></a>

## Bot

Polling (aiogram 3.30), not a customer-facing website. Menu Button Web App URL = public HTTPS Mini App.

Commands (allowlisted users):

| Command | Meaning |
|---------|---------|
| `/start` | Intro; Mini App button |
| `/help` | Short help |
| `/wipe` | Ask to delete this user’s data; confirm with **да** |
| `/remind_test` | Developer: send today’s reminder logic now |

Users not on `ALLOWED_TELEGRAM_IDS` get a private-bot message.

## Reminders (MSK)

Daily job at `REMINDER_HOUR`:`REMINDER_MINUTE` (default **09:00 MSK**), timezone `BOT_TIMEZONE` / `Europe/Moscow`.

- Readings: N days before each apartment’s `reading_due_day`
- Payment: N days before the same due day; skips months already marked paid
- Report: on `report_day` — previous calendar month, three apartments

Settings live in SQLite (Mini App → Notifications).

## Mini App

Must be opened from Telegram so `initData` is present. Production `DEV_AUTH=0`.

---

<a id="русский"></a>

## Бот

Polling (aiogram 3.30), не сайт для заказчика. Menu Button Web App URL = публичный HTTPS Mini App.

Команды (пользователи из allowlist):

| Command | Meaning |
|---------|---------|
| `/start` | Приветствие; кнопка Mini App |
| `/help` | Краткая справка |
| `/wipe` | Запрос на удаление данных этого пользователя; подтверждение **да** |
| `/remind_test` | Для разработчика: сразу отправить логику сегодняшних напоминаний |

Кто не в `ALLOWED_TELEGRAM_IDS`, получает сообщение о приватном боте.

## Напоминания (MSK)

Ежедневный job в `REMINDER_HOUR`:`REMINDER_MINUTE` (по умолчанию **09:00 MSK**), timezone `BOT_TIMEZONE` / `Europe/Moscow`.

- Показания: за N дней до `reading_due_day` каждой квартиры
- Оплата: за N дней до того же срока; пропускает уже отмеченные paid
- Отчёт: в `report_day` — предыдущий календарный месяц, три квартиры

Настройки живут в SQLite (Mini App → Уведомления).

## Mini App

Открывать из Telegram, чтобы был `initData`. Production: `DEV_AUTH=0`.
