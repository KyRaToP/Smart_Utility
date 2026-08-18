# Security

**Language:** [English](#english) · [Русский](#русский)

<a id="english"></a>

## Model

Private Mini App. Not a payment app. Secrets live only in host environment / Railway Variables — never in the Mini App bundle.

## Controls

| Control | Behavior |
|---------|----------|
| `ALLOWED_TELEGRAM_IDS` | Empty = nobody (bot + Telegram API path) |
| `initData` HMAC | Telegram `WebAppData` + `BOT_TOKEN`; `hmac.compare_digest` |
| `auth_date` | Reject future (>60s skew) and older than `AUTH_DATE_MAX_AGE_SECONDS` (default 86400) |
| `DEV_AUTH` | Default `0`. Unsigned `X-Dev-Telegram-Id` only when `DEV_AUTH=1` **and** the process is **not** on Railway. Loopback is not trusted. Production: `0` |
| CORS | `WEBAPP_URL` + Vite localhost + `CORS_ORIGINS` |
| `/wipe` | Deletes only the caller’s `telegram_id` rows after **да** |
| SQLite | Isolation by `telegram_id` |

## Incidents

| Event | Action |
|-------|--------|
| Leaked `BOT_TOKEN` | Revoke in BotFather; set new Railway variable; restart API+bot |
| Wrong ID on allowlist | Remove ID; restart |
| Mini App opened in a raw browser | Expected 401 — must open from the bot |
| SQLite copied off host | Treat names, readings, tariffs as personal data; restore backup if needed |

## Warranty

**14 days after handover.**

This file is operational guidance, not legal advice.

---

<a id="русский"></a>

## Model

Приватное Mini App. Не платёжное приложение. Секреты только в окружении хоста / Railway Variables — никогда в бандле Mini App.

## Controls

| Control | Behavior |
|---------|----------|
| `ALLOWED_TELEGRAM_IDS` | Пусто = никто (бот + путь Telegram API) |
| `initData` HMAC | Telegram `WebAppData` + `BOT_TOKEN`; `hmac.compare_digest` |
| `auth_date` | Отказ, если в будущем (>60с skew) или старше `AUTH_DATE_MAX_AGE_SECONDS` (по умолчанию 86400) |
| `DEV_AUTH` | По умолчанию `0`. Unsigned `X-Dev-Telegram-Id` только при `DEV_AUTH=1` **и** если процесс **не** на Railway. Loopback не доверяется. Production: `0` |
| CORS | `WEBAPP_URL` + Vite localhost + `CORS_ORIGINS` |
| `/wipe` | Удаляет только строки вызывающего `telegram_id` после **да** |
| SQLite | Изоляция по `telegram_id` |

## Incidents

| Event | Action |
|-------|--------|
| Утечка `BOT_TOKEN` | Revoke в BotFather; новая переменная Railway; рестарт API+бота |
| Чужой ID в allowlist | Убрать ID; рестарт |
| Mini App в обычном браузере | Ожидаемый 401 — открывать из бота |
| SQLite скопирован с хоста | Имена, показания, тарифы — персональные данные; при необходимости restore |

## Warranty

**14 дней после передачи.**

Документ — операционная памятка, не юридическая консультация.
