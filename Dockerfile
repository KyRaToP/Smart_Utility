# --- Build Mini App (same origin as API → empty VITE_API_URL) ---
FROM node:20-alpine AS miniapp
WORKDIR /miniapp
COPY miniapp/package.json miniapp/package-lock.json ./
RUN npm ci
COPY miniapp/ ./
# Served from the same Railway host as /api — no separate Pages URL required.
ENV VITE_BASE=/
ENV VITE_API_URL=
RUN npm run build

# --- API + Bot + static Mini App ---
FROM python:3.11-slim

WORKDIR /app

COPY api/requirements.txt api/requirements.txt
COPY bot/requirements.txt bot/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt -r bot/requirements.txt

COPY api api
COPY bot bot
COPY scripts scripts
COPY --from=miniapp /miniapp/dist /app/static

RUN chmod +x scripts/start_railway.sh \
  && mkdir -p /data

ENV PYTHONUNBUFFERED=1
ENV DATABASE_PATH=/data/smart_utility.db
ENV STATIC_DIR=/app/static

CMD ["bash", "scripts/start_railway.sh"]
