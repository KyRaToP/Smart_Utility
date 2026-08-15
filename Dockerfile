FROM python:3.11-slim

WORKDIR /app

COPY api/requirements.txt api/requirements.txt
COPY bot/requirements.txt bot/requirements.txt
RUN pip install --no-cache-dir -r api/requirements.txt -r bot/requirements.txt

COPY api api
COPY bot bot
COPY scripts scripts
RUN chmod +x scripts/start_railway.sh \
  && mkdir -p /data

ENV PYTHONUNBUFFERED=1
ENV DATABASE_PATH=/data/smart_utility.db

CMD ["bash", "scripts/start_railway.sh"]
