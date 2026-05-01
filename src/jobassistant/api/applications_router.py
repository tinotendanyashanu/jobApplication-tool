from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from jobassistant.db.applications_repo import (
    delete_application,
    fetch_application,
    insert_application,
    list_applications,
    update_application,
)
from jobassistant.db.pool import get_pool
from jobassistant.schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    SortKey,
)

router = APIRouter(prefix="/applications", tags=["applications"])


def require_db_pool():
    pool = get_pool()
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DATABASE_URL is not configured; application tracking APIs are unavailable.",
        )
    return pool


def parse_user_id(x_user_id: str | None = Header(default=None, alias="X-User-Id")) -> UUID:
    if x_user_id is None or not x_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing X-User-Id header.",
        )
    try:
        return UUID(x_user_id.strip())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid X-User-Id header (must be a UUID).",
        ) from exc


@router.post("", response_model=ApplicationOut)
def create_application(
    body: ApplicationCreate,
    pool=Depends(require_db_pool),
    user_id: UUID = Depends(parse_user_id),
) -> ApplicationOut:
    row = insert_application(pool, user_id=user_id, data=body)
    return ApplicationOut.model_validate(row)


@router.get("", response_model=list[ApplicationOut])
def get_applications(
    pool=Depends(require_db_pool),
    user_id: UUID = Depends(parse_user_id),
    *,
    q: str | None = Query(default=None, description="Search job title or company."),
    status: str | None = Query(default=None, description="Filter by status."),
    sort: SortKey = Query(default="date_desc"),
) -> list[ApplicationOut]:
    try:
        rows = list_applications(
            pool,
            user_id=user_id,
            q=q,
            status=status,
            sort=sort,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return [ApplicationOut.model_validate(r) for r in rows]


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: UUID,
    pool=Depends(require_db_pool),
    user_id: UUID = Depends(parse_user_id),
) -> ApplicationOut:
    row = fetch_application(pool, user_id=user_id, application_id=application_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    return ApplicationOut.model_validate(row)


@router.put("/{application_id}", response_model=ApplicationOut)
def put_application(
    application_id: UUID,
    body: ApplicationUpdate,
    pool=Depends(require_db_pool),
    user_id: UUID = Depends(parse_user_id),
) -> ApplicationOut:
    row = update_application(
        pool, user_id=user_id, application_id=application_id, data=body
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    return ApplicationOut.model_validate(row)


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_application(
    application_id: UUID,
    pool=Depends(require_db_pool),
    user_id: UUID = Depends(parse_user_id),
) -> None:
    ok = delete_application(pool, user_id=user_id, application_id=application_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
