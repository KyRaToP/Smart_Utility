# Deployment

**Language:** [English](#english) · [Русский](#русский)

<a id="english"></a>

## Production (Railway)

1. Create a **web** service from this repo (`Dockerfile`).
2. Attach a **Volume** at `/data`.
3. Variables (names only — set values in the dashboard, never in Git):
   - `BOT_TOKEN`
   - `ALLOWED_TELEGRAM_IDS` (numeric IDs, comma-separated, **required**)
   - `DEV_AUTH=0`
   - `DATABASE_PATH=/data/smart_utility.db`
   - `WEBAPP_URL` optional; if empty or still `github.io`, code uses `https://` + `RAILWAY_PUBLIC_DOMAIN`
4. Public HTTPS URL of the service = Mini App + `/api`.
5. BotFather → Menu Button / Web App URL = that HTTPS URL.
6. Confirm Volume persists across deploys.

Start command is `bash scripts/start_railway.sh` (image `CMD`).

## Optional GitHub Pages Mini App

Not required when Railway serves the built Mini App. If used: set `VITE_API_URL` to the Railway HTTPS API origin and rebuild.

## Local

`DEV_AUTH=1` **only on localhost**. Railway ignores `DEV_AUTH=1` even if the variable is set.

Times: reminders **09:00 MSK** unless `REMINDER_HOUR` / `REMINDER_MINUTE` change.

---

<a id="русский"></a>

## Production (Railway)

1. Создать **web**-сервис из этого репозитория (`Dockerfile`).
2. Подключить **Volume** на `/data`.
3. Переменные (только имена — значения в dashboard, не в Git):
   - `BOT_TOKEN`
   - `ALLOWED_TELEGRAM_IDS` (числовые ID через запятую, **обязательно**)
   - `DEV_AUTH=0`
   - `DATABASE_PATH=/data/smart_utility.db`
   - `WEBAPP_URL` опционально; если пусто или всё ещё `github.io`, код берёт `https://` + `RAILWAY_PUBLIC_DOMAIN`
4. Публичный HTTPS URL сервиса = Mini App + `/api`.
5. BotFather → Menu Button / Web App URL = этот HTTPS URL.
6. Проверить, что Volume переживает деплои.

Команда старта: `bash scripts/start_railway.sh` (`CMD` образа).

## Опциональный GitHub Pages Mini App

Не обязателен, когда Railway отдаёт собранный Mini App. Если используете: `VITE_API_URL` на HTTPS origin Railway API и пересборка.

## Локально

`DEV_AUTH=1` **только на localhost**. Railway игнорирует `DEV_AUTH=1`, даже если переменная задана.

Время: напоминания **09:00 MSK**, если не изменены `REMINDER_HOUR` / `REMINDER_MINUTE`.
