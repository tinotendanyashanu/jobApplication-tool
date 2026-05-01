from __future__ import annotations

from typing import Any
from uuid import UUID

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from jobassistant.schemas.application import (
    APPLICATION_STATUSES,
    ApplicationCreate,
    ApplicationUpdate,
    SortKey,
)


def _row_to_api(row: dict[str, Any]) -> dict[str, Any]:
    out = dict(row)
    for k in ("id", "user_id"):
        if out.get(k) is not None:
            out[k] = str(out[k])
    return out


def insert_application(
    pool: ConnectionPool,
    *,
    user_id: UUID,
    data: ApplicationCreate,
) -> dict[str, Any]:
    query = """
    INSERT INTO applications (
      user_id, job_title, company, job_description,
      match_score, skill_match, experience_match, keyword_match,
      strengths, gaps, cv_text, cover_letter_text, status, applied_at,
      response_probability, confidence_level,
      outcome, response_time_days
    )
    VALUES (
      %(user_id)s, %(job_title)s, %(company)s, %(job_description)s,
      %(match_score)s, %(skill_match)s, %(experience_match)s, %(keyword_match)s,
      %(strengths)s, %(gaps)s, %(cv_text)s, %(cover_letter_text)s,
      CAST(%(status)s AS application_status), %(applied_at)s,
      %(response_probability)s, %(confidence_level)s,
      CAST(%(outcome)s AS application_outcome), %(response_time_days)s
    )
    RETURNING *
    """
    payload = data.model_dump()
    payload["user_id"] = str(user_id)
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, payload)
            row = cur.fetchone()
            assert row is not None
            conn.commit()
            return _row_to_api(row)


def fetch_application(
    pool: ConnectionPool,
    *,
    user_id: UUID,
    application_id: UUID,
) -> dict[str, Any] | None:
    query = """
    SELECT * FROM applications
    WHERE id = %(id)s AND user_id = %(user_id)s
    LIMIT 1
    """
    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, {"id": str(application_id), "user_id": str(user_id)})
            row = cur.fetchone()
            return _row_to_api(row) if row else None


def list_applications(
    pool: ConnectionPool,
    *,
    user_id: UUID,
    q: str | None,
    status: str | None,
    sort: SortKey,
) -> list[dict[str, Any]]:
    fragments = ["user_id = %(user_id)s"]
    params: dict[str, Any] = {"user_id": str(user_id)}

    if q and q.strip():
        fragments.append("(job_title ILIKE %(needle)s OR company ILIKE %(needle)s)")
        params["needle"] = f"%{q.strip()}%"

    if status:
        if status not in APPLICATION_STATUSES:
            raise ValueError(f"invalid status: {status}")
        fragments.append("status = CAST(%(status_filter)s AS application_status)")
        params["status_filter"] = status

    order_clause = _order_clause(sort)
    query = (
        "SELECT * FROM applications WHERE "
        + " AND ".join(fragments)
        + " ORDER BY "
        + order_clause
    )

    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
            return [_row_to_api(r) for r in rows]


def _order_clause(sort: SortKey) -> str:
    if sort == "date_desc":
        return "created_at DESC NULLS LAST, id DESC"
    if sort == "date_asc":
        return "created_at ASC NULLS LAST, id ASC"
    if sort == "score_desc":
        return "match_score DESC NULLS LAST, created_at DESC, id DESC"
    if sort == "score_asc":
        return "match_score ASC NULLS LAST, created_at DESC, id DESC"
    raise ValueError(sort)


def update_application(
    pool: ConnectionPool,
    *,
    user_id: UUID,
    application_id: UUID,
    data: ApplicationUpdate,
) -> dict[str, Any] | None:
    raw = data.model_dump(exclude_unset=True)
    allowed = {
        "job_title",
        "company",
        "job_description",
        "match_score",
        "skill_match",
        "experience_match",
        "keyword_match",
        "strengths",
        "gaps",
        "cv_text",
        "cover_letter_text",
        "applied_at",
        "status",
        "response_probability",
        "confidence_level",
        "outcome",
        "response_time_days",
    }

    assignments: list[str] = []
    values: dict[str, Any] = {
        "id": str(application_id),
        "user_id": str(user_id),
    }

    for key, val in raw.items():
        if key not in allowed:
            continue
        if key == "status":
            assignments.append(f"status = CAST(%({key})s AS application_status)")
        elif key == "outcome":
            assignments.append(f"outcome = CAST(%({key})s AS application_outcome)")
        else:
            assignments.append(f"{key} = %({key})s")
        values[key] = val

    if not assignments:
        return fetch_application(pool, user_id=user_id, application_id=application_id)

    query = (
        "UPDATE applications SET "
        + ", ".join(assignments)
        + " WHERE id = %(id)s AND user_id = %(user_id)s RETURNING *"
    )

    with pool.connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            conn.commit()
            return _row_to_api(row) if row else None


def delete_application(
    pool: ConnectionPool,
    *,
    user_id: UUID,
    application_id: UUID,
) -> bool:
    query = """
    DELETE FROM applications
    WHERE id = %(id)s AND user_id = %(user_id)s
    """
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, {"id": str(application_id), "user_id": str(user_id)})
            deleted = cur.rowcount or 0
            conn.commit()
            return deleted > 0
