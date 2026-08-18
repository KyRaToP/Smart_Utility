# Database

**Language:** [English](#english) · [Русский](#русский)

<a id="english"></a>

## Engine

**SQLite** (one file). Default local path: `api/data/smart_utility.db`. Production: `DATABASE_PATH` (Railway `/data/smart_utility.db`).

All stored dates/times used by reminders are interpreted in **MSK** via the bot scheduler (`Europe/Moscow`). Payment `paid_at` is a string from the Mini App (treat as MSK when displaying).

## Tables

| Table | Purpose |
|-------|---------|
| `users` | `telegram_id`, onboarding flag, notification prefs (`readings_*`, `payment_*`, `report_day`) |
| `apartments` | Exactly three per onboarded user; `reading_due_day` (default 25) |
| `services` | Tariff, `calc_type`, meter flag |
| `meters` | Linked to metered services (incl. day/night zone) |
| `readings` | Monthly values; baseline months marked `is_initial` |
| `charges` | Saved calculation lines + formula snapshot |
| `payments` | Status / amount / `paid_at` — **not** a payment-provider ledger |

## Backup / restore

Copy the `.db` file. Restore by replacing the file at `DATABASE_PATH` and restarting. `/wipe` deletes **one** user’s rows only.

Do not commit the database file.

---

<a id="русский"></a>

## Engine

**SQLite** (один файл). Локальный путь по умолчанию: `api/data/smart_utility.db`. Production: `DATABASE_PATH` (Railway `/data/smart_utility.db`).

Даты/время для напоминаний считаются в **MSK** через планировщик бота (`Europe/Moscow`). `paid_at` — строка из Mini App (при показе трактовать как MSK).

## Tables

| Table | Purpose |
|-------|---------|
| `users` | `telegram_id`, флаг onboarding, настройки уведомлений (`readings_*`, `payment_*`, `report_day`) |
| `apartments` | Ровно три на onboarded-пользователя; `reading_due_day` (по умолчанию 25) |
| `services` | Тариф, `calc_type`, флаг счётчика |
| `meters` | Привязка к услугам со счётчиком (включая день/ночь) |
| `readings` | Значения за месяц; baseline-месяцы с `is_initial` |
| `charges` | Сохранённые строки расчёта + снимок формулы |
| `payments` | Статус / сумма / `paid_at` — **не** реестр платёжного провайдера |

## Backup / restore

Копия файла `.db`. Restore — подмена файла по `DATABASE_PATH` и рестарт. `/wipe` удаляет строки **одного** пользователя.

Файл базы в Git не коммитить.
