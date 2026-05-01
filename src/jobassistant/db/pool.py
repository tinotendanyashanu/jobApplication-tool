from __future__ import annotations

from psycopg_pool import ConnectionPool

_pool: ConnectionPool | None = None


def init_pool(database_url: str, *, max_size: int = 10) -> ConnectionPool | None:
    """Create a pooled connection factory. Caller owns lifecycle."""
    global _pool
    if _pool is not None:
        _pool.close()
    _pool = ConnectionPool(conninfo=database_url, min_size=1, max_size=max_size)
    return _pool


def get_pool() -> ConnectionPool | None:
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
