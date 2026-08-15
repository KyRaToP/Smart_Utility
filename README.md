# Smart_Utility

Telegram Bot + Mini App для ежемесячного учёта коммунальных платежей по **трём квартирам**.

Реализует разработчик. Пользуется другой человек в своём Telegram. В коде нет его адресов и тарифов.

## Готово локально

- Mini App (React + Vite) по `design_spec.md`
- FastAPI + SQLite + calculation layer
- Telegram-бот: `/start`, `/help`, Menu Button, **ежедневные напоминания**
- Напоминания читают настройки из той же SQLite, что и API

Осталось с вашей стороны позже: HTTPS-деплой Mini App + API и привязка в BotFather.

## Этап 9 — прогон первого запуска

Локально (браузер / телефон в Wi‑Fi, режим **«как у пользователя»**):

1. Onboarding: три имени квартир (не чужие адреса из demo).
2. Настройки → Добавить услугу (со счётчиком и тарифом с квитанции).
3. Показания или **Уже оплаченный месяц**: сохранить базу (например август).
4. Убедиться: за этот месяц «нечего считать» — это нормально для базы.
5. Главная: кнопка **«Отметить оплаченным»** (не банковский платёж).
6. `/start` и `/help` в боте — понятные тексты без жаргона (нужен запущенный бот + `BOT_TOKEN`).

В Telegram целиком (кнопка открывает Mini App) — нужен HTTPS, см. ниже.

## Deploy: GitHub Pages + Railway

Схема без вашего ПК:

| Часть | Куда |
|---|---|
| Mini App | GitHub Pages (`WEBAPP_URL`) |
| API + Bot | один сервис Railway (общая SQLite) |

Подробные шаги — в чате с ассистентом или ниже кратко.

### Railway
- `Dockerfile` в корне репозитория
- Start: `bash scripts/start_railway.sh`
- Volume (желательно): mount `/data`
- Env: `BOT_TOKEN`, `WEBAPP_URL`, `ALLOWED_TELEGRAM_IDS` (**обязателен**, хотя бы один ID), `DEV_AUTH=0`, `DATABASE_PATH=/data/smart_utility.db`
- Опционально: `CORS_ORIGINS` (доп. origins через запятую), `AUTH_DATE_MAX_AGE_SECONDS` (по умолчанию 86400)

### GitHub Pages
- Workflow: `.github/workflows/deploy-pages.yml`
- Repo variable `VITE_API_URL` = публичный HTTPS URL Railway API
- Settings → Pages → Source: GitHub Actions

## Mini App

```powershell
cd c:\projects\Smart_Utility\miniapp
npm install
npm run dev
```

Откройте http://localhost:5173 (или порт, который покажет Vite).

Переключатель в DEV:

- **demo-данные** — вёрстка
- **как у пользователя** — onboarding и данные через API

```powershell
npm run lint
npm run build
```

## API

```powershell
cd c:\projects\Smart_Utility\api
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
.\venv\Scripts\python.exe -m pytest test_app.py
```

Пока `DEV_AUTH=1` (только локально), API принимает заголовок `X-Dev-Telegram-Id`.
По умолчанию `DEV_AUTH=0`: нужен Telegram `initData`. Пустой `ALLOWED_TELEGRAM_IDS` на пути Telegram — отказ (503), не «открыто всем».

База: `api/data/smart_utility.db` (не в git).

## Bot и напоминания

В `.env` (корне проекта, файл не коммитится):

```text
BOT_TOKEN=
WEBAPP_URL=
ALLOWED_TELEGRAM_IDS=<ваш_telegram_id>
DEV_AUTH=1
BOT_TIMEZONE=Europe/Moscow
REMINDER_HOUR=9
REMINDER_MINUTE=0
```

На **проде** (Railway): `DEV_AUTH=0` и тот же непустой `ALLOWED_TELEGRAM_IDS`.
`WEBAPP_URL` также используется для CORS (браузерный доступ к API только с этого origin + localhost Vite).
```powershell
cd c:\projects\Smart_Utility\bot
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe bot.py
```

Каждый день в 09:00 (Europe/Moscow) бот смотрит настройки пользователя:

| Тип | Когда |
|---|---|
| Показания | за N дней до `reading_due_day` каждой квартиры |
| Оплата | за N дней до того же срока; пропускает уже оплаченные |
| Отчёт | в `report_day` — сводка по 3 квартирам за прошлый месяц |

Настройки: Mini App → Настройки → Уведомления.

Локальный тест без ожидания 09:00:

```text
/remind_test
```

Нужны: запущенный API, onboarding в режиме «как у пользователя» под вашим `telegram_id` (в Telegram) **или** для браузера DEV id `1001` — тогда `/remind_test` сработает только если ваш реальный Telegram ID совпал с записью в БД. Для проверки логики напоминаний удобнее заполнить `BOT_TOKEN`, пройти onboarding из Mini App внутри Telegram позже; до деплоя можно править день показаний квартиры на «сегодня + N».

Проверка логики без Telegram:

```powershell
cd c:\projects\Smart_Utility\bot
.\venv\Scripts\python.exe -m pytest test_reminders.py
```

## Handoff (когда будете передавать человеку)

1. Задеплоить Mini App (Vercel) и API (Render) на HTTPS.
2. В `.env` / хостинге: `WEBAPP_URL`, `BOT_TOKEN`, `ALLOWED_TELEGRAM_IDS=<его_id>` (обязательно), `DEV_AUTH=0`.
3. BotFather → Menu Button = `WEBAPP_URL`.
4. Запустить бота (ПК или сервер).
5. Он: `/start` → назвать 3 квартиры → услуги → показания.
6. Не заходите в его данные и не коммитьте `.env`.

## Секреты и git

- `.env` никогда не в коммитах
- есть `.env.example` без секретов
- перед коммитом: `git status` — `.env` не должен быть staged

## Что осталось

1. HTTPS-деплой Mini App + API  
2. Привязка в Telegram (BotFather + `WEBAPP_URL`)  
3. Прогон `/start` → Mini App на телефоне (свой аккаунт, потом end user)  

### Прогон в Telegram (что нужно вам)

Telegram Mini App открывается только по **HTTPS**. Локальный `http://192.168.x.x` в WebApp Telegram не подойдёт.

1. Задеплоить **Mini App** (например Vercel) → получить `https://….vercel.app`
2. Задеплоить **API** (например Render) → `https://….onrender.com`
3. В Mini App задать URL API (`VITE_API_URL` на хостинге)
4. В корневом `.env` (и на сервере бота):  
   `BOT_TOKEN`, `WEBAPP_URL=<https миниаппа>`, `ALLOWED_TELEGRAM_IDS=<ваш telegram id>` (обязательно)  
   На проде API: `DEV_AUTH=0` (проверка initData + allowlist; пустой allowlist = отказ)
5. BotFather → Menu Button = тот же `WEBAPP_URL`
6. Запустить бота (`bot.py`), в Telegram: `/start` → «Открыть приложение»
7. Пройти сценарий этапа 9 уже внутри Telegram

Свой Telegram ID: @userinfobot или аналог. Файл `.env` правите только вы — агент его не открывает.
