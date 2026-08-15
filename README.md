# Smart_Utility

Telegram Bot + Mini App для ежемесячного учёта коммунальных платежей по **трём квартирам**.

Реализует разработчик. Пользуется другой человек в своём Telegram. В коде нет его адресов и тарифов.

## Готово локально

- Mini App (React + Vite) по `design_spec.md`
- FastAPI + SQLite + calculation layer
- Telegram-бот: `/start`, `/help`, Menu Button, **ежедневные напоминания**
- Напоминания читают настройки из той же SQLite, что и API

Осталось с вашей стороны позже: HTTPS-деплой Mini App + API и привязка в BotFather.

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

Пока `BOT_TOKEN` пуст, API в DEV_AUTH принимает заголовок `X-Dev-Telegram-Id`.

База: `api/data/smart_utility.db` (не в git).

## Bot и напоминания

В `.env` (корне проекта, файл не коммитится):

```text
BOT_TOKEN=
WEBAPP_URL=
ALLOWED_TELEGRAM_IDS=
DEV_AUTH=1
BOT_TIMEZONE=Europe/Moscow
REMINDER_HOUR=9
REMINDER_MINUTE=0
```

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
2. В `.env` / хостинге: `WEBAPP_URL`, `BOT_TOKEN`, `ALLOWED_TELEGRAM_IDS=<его_id>`.
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
3. Прогон на телефоне у конечного пользователя  
