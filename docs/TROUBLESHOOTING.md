# Troubleshooting

**Language:** [English](#english) · [Русский](#русский)

<a id="english"></a>

## Matrix

| Symptom | Checks |
|---------|--------|
| Private bot message | ID in `ALLOWED_TELEGRAM_IDS`; empty list = nobody |
| 401 Mini App | Open from Menu Button; `initData` expiry (`AUTH_DATE_MAX_AGE_SECONDS`, default 24h) |
| 503 BOT_TOKEN | Railway variable empty |
| 503 allowlist | `ALLOWED_TELEGRAM_IDS` empty |
| CORS / browser API | Origin must be `WEBAPP_URL` or listed `CORS_ORIGINS` |
| No **09:00 MSK** push | Bot loop in `start_railway.sh`; `BOT_TIMEZONE`; user onboarded; notification flags |
| Menu Button on Pages | Remove github.io `WEBAPP_URL` on Railway |
| `/remind_test` empty | No matching due day; or profile not in DB |
| Wipe no-op | File missing; or confirmed **нет** |
| pytest | `api/test_app.py`, `bot/test_reminders.py`, `bot/test_wipe.py` |

Do not print environment **values**. Confirm **names** exist in the host UI.

---

<a id="русский"></a>

## Matrix

| Symptom | Checks |
|---------|--------|
| Сообщение «бот приватный» | ID в `ALLOWED_TELEGRAM_IDS`; пустой список = никто |
| 401 Mini App | Открывать из Menu Button; срок `initData` (`AUTH_DATE_MAX_AGE_SECONDS`, по умолчанию 24ч) |
| 503 BOT_TOKEN | Пустая переменная Railway |
| 503 allowlist | Пустой `ALLOWED_TELEGRAM_IDS` |
| CORS / browser API | Origin должен быть `WEBAPP_URL` или в `CORS_ORIGINS` |
| Нет пуша в **09:00 MSK** | Цикл бота в `start_railway.sh`; `BOT_TIMEZONE`; onboarding; флаги уведомлений |
| Menu Button на Pages | Убрать github.io `WEBAPP_URL` на Railway |
| `/remind_test` пусто | Нет подходящего дня; или профиля нет в БД |
| Wipe ничего не сделал | Нет файла; или ответили **нет** |
| pytest | `api/test_app.py`, `bot/test_reminders.py`, `bot/test_wipe.py` |

Не печатать **значения** переменных окружения. В UI хостинга проверять только **имена**.
