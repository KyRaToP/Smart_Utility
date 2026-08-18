# Architecture

**Language:** [English](#english) · [Русский](#русский)

<a id="english"></a>

## Overview

Private household tool: Telegram Mini App + REST API + bot, one SQLite file. Not a payment processor.

All clocks: **MSK (UTC+3)**. Scheduler timezone: `Europe/Moscow` (`BOT_TIMEZONE`).

## Runtime pieces

| Piece | Role |
|-------|------|
| Mini App (React) | UI inside Telegram WebApp |
| FastAPI | Auth, state API, calculation persistence, static Mini App on Railway |
| Bot (aiogram) | Access gate, Menu Button, `/wipe`, daily reminder job |
| SQLite | Users, 3 apartments, services, meters, readings, charges, payments |
| APScheduler | One daily cron (`REMINDER_HOUR`:`REMINDER_MINUTE`, default **09:00 MSK**) |

On Railway, `scripts/start_railway.sh` starts Uvicorn and a bot restart loop. The API can stay healthy if the bot crashes.

## Trust boundary

- Browser/Mini App never receives `BOT_TOKEN`.
- Production requests must carry Telegram `initData`; the API verifies HMAC and `auth_date`, then checks `ALLOWED_TELEGRAM_IDS`.
- CORS is limited to `WEBAPP_URL` + local Vite origins (+ optional `CORS_ORIGINS`).

## Related docs

[`API.md`](API.md) · [`DATABASE.md`](DATABASE.md) · [`TELEGRAM.md`](TELEGRAM.md) · [`SECURITY.md`](SECURITY.md) · [`DEPLOYMENT.md`](DEPLOYMENT.md)

---

<a id="русский"></a>

## Обзор

Приватный семейный учёт: Mini App + REST API + бот, один файл SQLite. Это **не** платёжный процессор.

Все часы: **MSK (UTC+3)**. Планировщик: `Europe/Moscow` (`BOT_TIMEZONE`).

## Части runtime

| Часть | Роль |
|-------|------|
| Mini App (React) | Интерфейс в Telegram WebApp |
| FastAPI | Auth, state API, сохранение расчётов, статика Mini App на Railway |
| Бот (aiogram) | Доступ, Menu Button, `/wipe`, ежедневные напоминания |
| SQLite | Пользователи, 3 квартиры, услуги, счётчики, показания, начисления, оплаты |
| APScheduler | Один daily cron (`REMINDER_HOUR`:`REMINDER_MINUTE`, по умолчанию **09:00 MSK**) |

На Railway `scripts/start_railway.sh` поднимает Uvicorn и цикл рестарта бота. API может остаться живым, если бот падает.

## Граница доверия

- Браузер/Mini App не получает `BOT_TOKEN`.
- На проде нужен Telegram `initData`; API проверяет HMAC и `auth_date`, затем `ALLOWED_TELEGRAM_IDS`.
- CORS ограничен `WEBAPP_URL` + локальные Vite origins (+ опционально `CORS_ORIGINS`).

## Related

[`API.md`](API.md) · [`DATABASE.md`](DATABASE.md) · [`TELEGRAM.md`](TELEGRAM.md) · [`SECURITY.md`](SECURITY.md) · [`DEPLOYMENT.md`](DEPLOYMENT.md)
