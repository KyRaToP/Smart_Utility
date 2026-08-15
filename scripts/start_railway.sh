#!/usr/bin/env bash
# Run API + bot in one Railway web service (shared SQLite).
# API stays up even if the bot crashes (e.g. missing BOT_TOKEN).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DATABASE_PATH="${DATABASE_PATH:-/data/smart_utility.db}"
mkdir -p "$(dirname "$DATABASE_PATH")"

cd "$ROOT/api"
python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" &
API_PID=$!

run_bot() {
  cd "$ROOT/bot"
  while true; do
    if python bot.py; then
      echo "Bot exited cleanly; restarting in 5s"
    else
      echo "Bot failed (check BOT_TOKEN and other Railway Variables); retry in 30s"
    fi
    sleep 30
  done
}

run_bot &
BOT_PID=$!

cleanup() {
  kill "$API_PID" "$BOT_PID" 2>/dev/null || true
}
trap cleanup EXIT

wait "$API_PID"
exit $?
