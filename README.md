# SMART UTILITY

Telegram Bot + Mini App для ежемесячного учёта коммунальных платежей по **трём квартирам**.

Реализует разработчик. Пользуется другой человек в своём Telegram. В коде нет его адресов и тарифов.

## Сейчас готово

UI prototype Mini App по `design_spec.md`:

- Design System (цвета, Inter, кнопки, карточки, Bottom Navigation);
- onboarding трёх квартир;
- экраны: Главная, Показания, Расчёт, Статистика, История, детали месяца, Настройки, услуга, уведомления, профиль;
- calculation layer в `miniapp/src/calc/` — формулы не спрятаны в UI;
- два режима данных: `mock` (проверка вёрстки) и `empty` (как у пользователя).

Backend (FastAPI + SQLite) уже есть. Режим **как у пользователя** ходит в API. Demo-данные по-прежнему только в браузере, для вёрстки.

## Mini App

Нужен Node.js 18+. Если `npm` не в PATH, укажите папку установки Node.

```powershell
cd c:\projects\utility-bot\miniapp
npm install
npm run dev
```

Откройте http://localhost:5173

В режиме разработки сверху есть переключатель:

- **demo-данные** — три демо-квартиры, чтобы проверить дизайн;
- **как у пользователя** — пустой onboarding без чужих цифр.

Production-сборка всегда стартует в empty-режиме.

```powershell
npm run lint
npm run build
```

Чтобы открыть Mini App внутри Telegram, нужен HTTPS URL (например ngrok на порт 5173) и этот URL в BotFather / `WEBAPP_URL`. Секреты для этого шага ещё можно не заполнять, пока смотрите браузер.

## API

Локально API работает **без секретов** (DEV_AUTH): браузер ходит как тестовый пользователь `1001`.

```powershell
cd c:\projects\utility-bot\api
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Проверка:

```powershell
cd c:\projects\utility-bot\api
.\venv\Scripts\python.exe -m pytest test_app.py
```

Mini App (`npm run dev`) проксирует `/api` на порт 8000. Для режима «как у пользователя» должны быть запущены **оба** сервера.

SQLite-файл: `api/data/smart_utility.db` (в git не попадает).

## Bot

1. Создайте бота в `@BotFather`.
2. В корне проекта уже есть `.env`. Вставьте туда значения сами:

```text
BOT_TOKEN=токен_от_BotFather
WEBAPP_URL=https://your-https-url
ALLOWED_TELEGRAM_IDS=telegram_id_пользователя
```

`ALLOWED_TELEGRAM_IDS` — allowlist. ID того человека, который будет пользоваться ботом. Свой ID можно добавить только для теста.

`.env` в git не попадает: он указан в `.gitignore`.

```powershell
cd c:\projects\utility-bot\bot
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe bot.py
```

## Секреты и git

- `.env` — только на вашей машине, в коммиты не кладём
- `.gitignore` игнорирует `.env`, `node_modules`, `dist`, `venv`
- перед каждым коммитом проверяем `git status`: `.env` не должен быть в staged files

## Что дальше

1. Прогон первого запуска внутри Telegram — нужны секреты: `BOT_TOKEN`, `WEBAPP_URL`, `ALLOWED_TELEGRAM_IDS`.
2. Напоминания бота: показания, оплата, отчёт по трём квартирам.
3. Передача человеку: ссылка `t.me/bot`, его ID в allowlist.
