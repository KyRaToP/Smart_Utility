# API

**Language:** [English](#english) · [Русский](#русский)

<a id="english"></a>

## Base

Same origin as the Mini App on Railway, or `http://127.0.0.1:8000` locally. Prefix `/api`.

Auth: Telegram header `X-Telegram-Init-Data` (signed `initData`). Local unsigned path: `X-Dev-Telegram-Id` only when `DEV_AUTH=1` and the process is not on Railway. See [`SECURITY.md`](SECURITY.md).

`GET /api/health` — liveness, no auth.

Authenticated endpoints return the full Mini App **state** after writes:

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/state` | Load state |
| POST | `/api/onboarding` | Exactly 3 apartment names |
| POST | `/api/apartments/active` | Active apartment |
| PATCH | `/api/apartments/{id}` | Name, rooms, area, `readingDueDay` |
| POST | `/api/services` | Create service |
| PATCH | `/api/services/{id}` | Update service |
| POST | `/api/readings` | Month + meter values |
| POST | `/api/baseline` | Already-paid month baseline |
| POST | `/api/calculations` | Persist month calc |
| POST | `/api/payments/paid` | Status only — not a charge to a card |
| PATCH | `/api/notifications` | Reminder toggles / days |

CORS: `WEBAPP_URL` + Vite localhost (+ `CORS_ORIGINS`).

---

<a id="русский"></a>

## Base

Тот же origin, что у Mini App на Railway, или `http://127.0.0.1:8000` локально. Префикс `/api`.

Auth: заголовок Telegram `X-Telegram-Init-Data` (подписанный `initData`). Локальный unsigned-путь: `X-Dev-Telegram-Id` только при `DEV_AUTH=1` и если процесс не на Railway. См. [`SECURITY.md`](SECURITY.md).

`GET /api/health` — liveness, без auth.

Авторизованные endpoints после записи возвращают полный **state** Mini App:

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/state` | Загрузить state |
| POST | `/api/onboarding` | Ровно 3 имени квартир |
| POST | `/api/apartments/active` | Активная квартира |
| PATCH | `/api/apartments/{id}` | Имя, комнаты, площадь, `readingDueDay` |
| POST | `/api/services` | Создать услугу |
| PATCH | `/api/services/{id}` | Обновить услугу |
| POST | `/api/readings` | Месяц + значения счётчиков |
| POST | `/api/baseline` | База уже оплаченного месяца |
| POST | `/api/calculations` | Сохранить расчёт месяца |
| POST | `/api/payments/paid` | Только статус — не списание с карты |
| PATCH | `/api/notifications` | Тумблеры / дни напоминаний |

CORS: `WEBAPP_URL` + Vite localhost (+ `CORS_ORIGINS`).
