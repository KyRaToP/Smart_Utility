# Smart Utility

Private Telegram Mini App for monthly utility tracking across **three apartments**. Not a payment app.

[English](#english) · [Русский](#русский)

---

<a id="english"></a>

## English

### For the customer

#### What is this

Smart Utility is a **private** Telegram bot + Mini App for one household: monthly meter readings, tariff-based totals, and payment **status** for exactly **three apartments**. Money is never charged inside the app. The customer enters names, tariffs, and readings; source code does not contain the customer’s addresses or rates.

All clocks in this product use **Moscow time (MSK, UTC+3)**. Default scheduler: `Europe/Moscow`.

#### How to use

1. Open the bot in Telegram → `/start` → **Open Mini App** (Menu Button).
2. Name the three apartments (your labels, not demo street addresses).
3. Add services and tariffs from the paper bill.
4. If this month is already paid, save it as a **baseline** (final readings).
5. Each later month: enter new readings → review the calculation → pay **outside** the app → tap **Mark as paid** (status only).
6. Optional: Settings → Notifications (reminders at **09:00 MSK** by default).
7. To erase your data: `/wipe`, then confirm with **да**.

#### Production URL

| Item | Value |
|------|--------|
| Mini App + API (HTTPS) | `[Railway HTTPS URL]` |
| Telegram bot | `[BotFather username]` |

Open the Mini App **from Telegram**, not from a random browser tab.

#### Core functions

- Three apartments, each with services, meters, and history
- Metered / two-zone / fixed / by-area calculations
- Daily reminders: readings, payment due, monthly report (**09:00 MSK**)
- **Mark as paid** = ledger status, not a bank transfer
- `/wipe` — delete this Telegram user’s data after confirmation

#### Security

The product is **private**. Only Telegram accounts on the developer’s allowlist can use it. There is no public sign-up and no in-app payments. If the bot token or allowlist might have leaked, stop using the bot and ask to **rotate** the token. Details: [`docs/SECURITY.md`](docs/SECURITY.md).

### For the developer

#### Architecture

One Railway Docker service:

| Piece | Role |
|-------|------|
| FastAPI | REST `/api`, static Mini App on `/` |
| React + Vite Mini App | Telegram WebApp (`initData`) |
| aiogram 3 bot | `/start`, `/help`, `/wipe`, Menu Button, reminders |
| SQLite | Shared file (`DATABASE_PATH`, Volume `/data`) |

Telegram path: HMAC `initData` + **allowlist**. Empty allowlist = reject all (503). Details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

#### Tech Stack

| Layer | Stack |
|-------|--------|
| Mini App | React 18, TypeScript, Vite 5 |
| API | Python 3.11, FastAPI, Uvicorn, SQLite |
| Bot | aiogram 3.30, APScheduler (`Europe/Moscow`) |
| Deploy | Docker, Railway Volume |

#### Project Structure

```text
api/          FastAPI + tests
bot/          Telegram bot + tests
miniapp/      React Mini App
scripts/      Railway start script
docs/         Technical documentation
Dockerfile
README.md
```

#### Installation

**API**

```powershell
cd api
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Mini App**

```powershell
cd miniapp
npm install
npm run dev
```

Open http://localhost:5173 (Vite proxies `/api` → port `8000`).

**Bot** (needs `BOT_TOKEN`)

```powershell
cd bot
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe bot.py
```

Requirements: Python 3.11+, Node.js 20+. Telegram WebApp needs **HTTPS**.

#### Environment

Set variables on the host. Do not commit values.

| Name | Required | Purpose |
|------|----------|---------|
| `BOT_TOKEN` | yes | BotFather token; `initData` HMAC |
| `ALLOWED_TELEGRAM_IDS` | yes in production | Comma-separated numeric IDs. Empty = nobody |
| `WEBAPP_URL` | recommended | Public HTTPS Mini App URL |
| `DATABASE_PATH` | no | SQLite path |
| `DEV_AUTH` | local only | Browser auth without Telegram; production `0` |
| `DEV_TELEGRAM_ID` | local only | Default `1001` |
| `BOT_TIMEZONE` | no | Default `Europe/Moscow` |
| `REMINDER_HOUR` / `REMINDER_MINUTE` | no | Default **09:00 MSK** |
| `AUTH_DATE_MAX_AGE_SECONDS` | no | `initData` max age (default 86400) |
| `CORS_ORIGINS` | no | Extra origins |
| `STATIC_DIR` | Docker | Built Mini App |
| `VITE_API_URL` | split hosting | API base if Mini App is separate |

#### Database

SQLite. Tables: `users`, `apartments`, `services`, `meters`, `readings`, `charges`, `payments`. Isolation by `telegram_id`. [`docs/DATABASE.md`](docs/DATABASE.md).

#### Testing

```powershell
cd api
.\venv\Scripts\python.exe -m pytest test_app.py

cd bot
.\venv\Scripts\python.exe -m pytest test_reminders.py test_wipe.py

cd miniapp
npm run lint
npm run build
```

Telegram: `/remind_test` (allowlisted user).

#### Deployment

Railway web service from `Dockerfile`, Volume `/data`, `DEV_AUTH=0`, non-empty allowlist. Menu Button = Railway HTTPS URL. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

#### Security

Allowlist + Telegram `initData` HMAC. `DEV_AUTH` is **localhost** only. Never put `BOT_TOKEN` in the Mini App or Git. [`docs/SECURITY.md`](docs/SECURITY.md).

### For support

#### Troubleshooting

| Symptom | Checks |
|---------|--------|
| Private bot | ID in `ALLOWED_TELEGRAM_IDS` |
| 401 Mini App | Open from Menu Button; `initData` expiry |
| 503 | Empty `BOT_TOKEN` or empty allowlist |
| No **09:00 MSK** reminder | Bot process; `BOT_TIMEZONE`; notification flags |
| Data gone after deploy | Volume `/data` |

Full matrix: [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md).

#### Backup

Copy the SQLite file (`DATABASE_PATH`, on Railway `/data/smart_utility.db`). Store **offline**, not in Git. Profile JSON export covers one user only.

#### Recovery

Restore the `.db` to the same path, restart API and bot, check `/api/health` and `/start`. After token rotate: update `BOT_TOKEN` and reopen Mini App from Telegram.

#### Maintenance

Keep Volume mounted. After deploy, confirm Mini App data. Reminders: **09:00 MSK**. `/wipe` is irreversible without backup. [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md).

#### Warranty

**14 days after handover** for delivered features (three-apartment tracking, calculations, reminders, wipe). Not covered: Telegram/Railway outages, lost data without backup, new features, user-entered tariff mistakes, using the app as a payment gateway.

#### Security (incidents)

Leaked token: revoke in BotFather, set new `BOT_TOKEN`, keep `DEV_AUTH=0`, confirm allowlist. [`docs/SECURITY.md`](docs/SECURITY.md).

---

<a id="русский"></a>

## Русский

### Для заказчика

#### Что это

Smart Utility — **приватный** Telegram-бот + Mini App для одной семьи: ежемесячные показания, расчёт по тарифам и **статус оплаты** ровно по **трём квартирам**. Деньги внутри приложения **не списываются**. Названия, тарифы и показания вводит заказчик; в исходном коде нет чужих адресов и ставок.

Все часы в продукте — **московское время (MSK, UTC+3)**. Планировщик по умолчанию: `Europe/Moscow`.

#### Как пользоваться

1. Бот в Telegram → `/start` → **Открыть приложение**.
2. Назвать три квартиры (свои подписи, не демо-адреса).
3. Добавить услуги и тарифы с квитанции.
4. Если месяц уже оплачен — сохранить как **базу** (конечные показания).
5. Дальше: новые показания → проверка расчёта → оплата **снаружи** → **Отметить оплаченным** (только статус).
6. По желанию: Настройки → Уведомления (напоминания в **09:00 MSK** по умолчанию).
7. Удалить данные: `/wipe`, подтверждение **да**.

#### Production URL

| Что | Значение |
|-----|----------|
| Mini App + API (HTTPS) | `[Railway HTTPS URL]` |
| Telegram-бот | `[имя бота]` |

Mini App открывать **из Telegram**, не из произвольной вкладки браузера.

#### Основные функции

- Три квартиры: свои услуги, счётчики и история
- Расчёт по счётчику / двум зонам / фикс / по площади
- Ежедневные напоминания: показания, срок оплаты, отчёт (**09:00 MSK**)
- **Отметить оплаченным** — статус в учёте, не банковский платёж
- `/wipe` — удаление данных этого Telegram-пользователя после подтверждения

#### Безопасность

Продукт **приватный**. Пользуются только аккаунты из allowlist разработчика. Публичной регистрации и оплаты в приложении нет. Если токен бота или список доступа могли утечь — не пользоваться ботом и попросить **сменить токен**. Подробнее: [`docs/SECURITY.md`](docs/SECURITY.md).

### Для разработчика

#### Architecture

Один Docker-сервис на Railway:

| Часть | Роль |
|-------|------|
| FastAPI | REST `/api`, статика Mini App на `/` |
| React + Vite Mini App | Telegram WebApp (`initData`) |
| aiogram 3 бот | `/start`, `/help`, `/wipe`, Menu Button, напоминания |
| SQLite | Общий файл (`DATABASE_PATH`, Volume `/data`) |

Путь Telegram: HMAC `initData` + **allowlist**. Пустой список = отказ всем (503). Подробнее: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

#### Tech Stack

| Слой | Стек |
|------|------|
| Mini App | React 18, TypeScript, Vite 5 |
| API | Python 3.11, FastAPI, Uvicorn, SQLite |
| Бот | aiogram 3.30, APScheduler (`Europe/Moscow`) |
| Деплой | Docker, Railway Volume |

#### Project Structure

```text
api/          FastAPI + тесты
bot/          Telegram-бот + тесты
miniapp/      React Mini App
scripts/      скрипт запуска Railway
docs/         техническая документация
Dockerfile
README.md
```

#### Installation

**API**

```powershell
cd api
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Mini App**

```powershell
cd miniapp
npm install
npm run dev
```

Открыть http://localhost:5173 (Vite проксирует `/api` на порт `8000`).

**Бот** (нужен `BOT_TOKEN`)

```powershell
cd bot
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe bot.py
```

Нужны Python 3.11+, Node.js 20+. Telegram WebApp требует **HTTPS**.

#### Environment

Переменные задаются на хосте. Значения не коммитить.

| Имя | Обязательно | Назначение |
|-----|-------------|------------|
| `BOT_TOKEN` | да | Токен BotFather; HMAC `initData` |
| `ALLOWED_TELEGRAM_IDS` | да в production | Числовые ID через запятую. Пусто = никто |
| `WEBAPP_URL` | рекомендуется | Публичный HTTPS Mini App |
| `DATABASE_PATH` | нет | Путь SQLite |
| `DEV_AUTH` | только локально | Auth без Telegram; production `0` |
| `DEV_TELEGRAM_ID` | только локально | По умолчанию `1001` |
| `BOT_TIMEZONE` | нет | По умолчанию `Europe/Moscow` |
| `REMINDER_HOUR` / `REMINDER_MINUTE` | нет | По умолчанию **09:00 MSK** |
| `AUTH_DATE_MAX_AGE_SECONDS` | нет | Срок `initData` (по умолчанию 86400) |
| `CORS_ORIGINS` | нет | Дополнительные origin |
| `STATIC_DIR` | Docker | Собранный Mini App |
| `VITE_API_URL` | раздельный хостинг | База API, если Mini App отдельно |

#### Database

SQLite. Таблицы: `users`, `apartments`, `services`, `meters`, `readings`, `charges`, `payments`. Изоляция по `telegram_id`. [`docs/DATABASE.md`](docs/DATABASE.md).

#### Testing

```powershell
cd api
.\venv\Scripts\python.exe -m pytest test_app.py

cd bot
.\venv\Scripts\python.exe -m pytest test_reminders.py test_wipe.py

cd miniapp
npm run lint
npm run build
```

Telegram: `/remind_test` (пользователь из allowlist).

#### Deployment

Web-сервис Railway из `Dockerfile`, Volume `/data`, `DEV_AUTH=0`, непустой allowlist. Menu Button = HTTPS URL Railway. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

#### Security

Allowlist + HMAC `initData`. `DEV_AUTH` **только localhost**. `BOT_TOKEN` не класть в Mini App и в Git. [`docs/SECURITY.md`](docs/SECURITY.md).

### Для поддержки

#### Troubleshooting

| Симптом | Проверить |
|---------|-----------|
| Приватный бот | ID в `ALLOWED_TELEGRAM_IDS` |
| 401 Mini App | Открыть из Menu Button; срок `initData` |
| 503 | Пустой `BOT_TOKEN` или пустой allowlist |
| Нет напоминания в **09:00 MSK** | Процесс бота; `BOT_TIMEZONE`; флаги уведомлений |
| Данные пропали после деплоя | Volume `/data` |

Полная матрица: [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md).

#### Backup

Копия файла SQLite (`DATABASE_PATH`, на Railway `/data/smart_utility.db`). Хранить **вне Git**. JSON-экспорт из профиля — только этот пользователь.

#### Recovery

Вернуть `.db` на тот же путь, перезапустить API и бота, проверить `/api/health` и `/start`. После смены токена: обновить `BOT_TOKEN` и открыть Mini App заново из Telegram.

#### Maintenance

Не терять Volume. После деплоя проверить данные Mini App. Напоминания: **09:00 MSK**. `/wipe` без backup необратим. [`docs/MAINTENANCE.md`](docs/MAINTENANCE.md).

#### Warranty

**14 дней после передачи** на сданный функционал (учёт трёх квартир, расчёты, напоминания, wipe). Не покрывается: сбои Telegram/Railway, потеря данных без backup, новые функции, ошибки тарифов, введённых пользователем, использование как платёжного шлюза.

#### Безопасность (инциденты)

Утечка токена: revoke в BotFather, новый `BOT_TOKEN`, `DEV_AUTH=0`, проверить allowlist. [`docs/SECURITY.md`](docs/SECURITY.md).

---

© All rights reserved.
