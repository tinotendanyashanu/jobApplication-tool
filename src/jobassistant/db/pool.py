from __future__ import annotations

import threading

from psycopg_pool import ConnectionPool

_pool: ConnectionPool | None = None
_lock = threading.Lock()
_dsn: str | None = None


def configure_db(dsn: str | None) -> None:
    """Remember the Postgres DSN for lazy pool creation (fast API / health startup)."""
    global _dsn
    if dsn and str(dsn).strip():
        _dsn = str(dsn).strip()
    else:
        _dsn = None


def _ensure_pool() -> ConnectionPool | None:
    global _pool
    if _dsn is None:
        return None
    if _pool is not None:
        return _pool
    with _lock:
        if _pool is not None:
            return _pool
        _pool = ConnectionPool(conninfo=_dsn, min_size=1, max_size=10)
        return _pool


def init_pool(database_url: str, *, max_size: int = 10) -> ConnectionPool | None:
    """Create or replace the pool immediately (eager). Prefer configure_db for web startup."""
    global _pool
    configure_db(database_url)
    with _lock:
        if _pool is not None:
            _pool.close()
            _pool = None
        if _dsn is None:
            return None
        _pool = ConnectionPool(conninfo=_dsn, min_size=1, max_size=max_size)
        return _pool


def get_pool() -> ConnectionPool | None:
    if _dsn is None:
        return None
    return _ensure_pool()


def close_pool() -> None:
    global _pool
    with _lock:
        if _pool is not None:
            _pool.close()
            _pool = None
