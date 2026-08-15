#!/usr/bin/env bash
# Run API + bot in one Railway web service (shared SQLite).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export DATABASE_PATH="${DATABASE_PATH:-/data/smart_utility.db}"
mkdir -p "$(dirname "$DATABASE_PATH")"

cd "$ROOT/api"
python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" &
API_PID=$!

cd "$ROOT/bot"
python bot.py &
BOT_PID=$!

cleanup() {
  kill "$API_PID" "$BOT_PID" 2>/dev/null || true
}
trap cleanup EXIT

wait -n "$API_PID" "$BOT_PID"
exit $?
