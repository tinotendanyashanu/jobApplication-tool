#!/usr/bin/env sh
# Apply supabase/migrations/*.sql to DATABASE_URL once per file (tracks in railway_schema_migrations).
# Used by Railway preDeployCommand on each deployment.

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
MIGRATIONS_DIR="${MIGRATIONS_DIR:-$REPO_ROOT/supabase/migrations}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "railway-migrate: DATABASE_URL is not set; skipping migrations."
  exit 0
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "railway-migrate: psql is required but not found" >&2
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "railway-migrate: migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'EOSQL'
CREATE TABLE IF NOT EXISTS railway_schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
EOSQL

applied_count=0
for f in $(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' | sort); do
  [ -f "$f" ] || continue
  name=$(basename "$f")
  applied=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM railway_schema_migrations WHERE filename = '${name}'" | tr -d '[:space:]')
  if [ "$applied" != "0" ]; then
    echo "railway-migrate: skip (already applied) $name"
    continue
  fi
  echo "railway-migrate: applying $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
    -c "INSERT INTO railway_schema_migrations (filename) VALUES ('${name}');"
  applied_count=$((applied_count + 1))
done

if [ "$applied_count" -eq 0 ]; then
  echo "railway-migrate: no pending migrations"
else
  echo "railway-migrate: applied ${applied_count} migration(s)"
fi
echo "railway-migrate: done"
