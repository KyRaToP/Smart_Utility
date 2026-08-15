# Smart_Utility API

FastAPI + SQLite.

Локально:

```powershell
cd c:\projects\Smart_Utility\api
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
.\venv\Scripts\python.exe -m pytest test_app.py
```

Пока `BOT_TOKEN` пуст, включён DEV_AUTH: Mini App в браузере ходит без Telegram initData.

Когда токен задан, API проверяет подпись `initData` и allowlist `ALLOWED_TELEGRAM_IDS`.
