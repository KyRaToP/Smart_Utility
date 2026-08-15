# Smart_Utility API

FastAPI + SQLite.

Локально:

```powershell
cd c:\projects\Smart_Utility\api
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
.\venv\Scripts\python.exe -m pytest test_app.py
```

Локальный браузер: в корневом `.env` задайте `DEV_AUTH=1` — Mini App ходит с `X-Dev-Telegram-Id`.
По умолчанию в коде `DEV_AUTH=0`.

Telegram-путь: проверка подписи `initData`, свежесть `auth_date`, и **обязательный** непустой `ALLOWED_TELEGRAM_IDS` (пустой список = 503, не «открыто всем»).
CORS ограничен `WEBAPP_URL` + localhost Vite (+ опционально `CORS_ORIGINS`).
