# Backend image for Railway (FastAPI + uvicorn)
FROM python:3.12-slim-bookworm AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md ./
COPY src ./src
COPY supabase ./supabase
COPY scripts ./scripts

RUN chmod +x scripts/railway-migrate.sh \
    && pip install --no-cache-dir pip setuptools wheel \
    && pip install --no-cache-dir .

EXPOSE 8000

# Single shell so Railway $PORT expands reliably (avoid nested sh -c quoting issues).
CMD ["/bin/sh", "-c", "exec uvicorn jobassistant.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
