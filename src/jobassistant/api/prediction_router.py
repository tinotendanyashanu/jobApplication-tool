from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from jobassistant.api.applications_router import parse_user_id, require_db_pool
from jobassistant.db.applications_repo import update_application
from jobassistant.schemas.application import ApplicationOut, ApplicationUpdate
from jobassistant.schemas.prediction import FeedbackRequest, PredictResponseRequest, PredictResponseResponse
from jobassistant.services.intelligence.response_prediction import run_response_prediction

router = APIRouter(tags=["prediction"])


@router.post("/predict-response", response_model=PredictResponseResponse)
def predict_response_route(body: PredictResponseRequest) -> PredictResponseResponse:
    """Transparent, heuristic blend — no ML dependencies."""
    return run_response_prediction(body)


@router.post("/feedback", response_model=ApplicationOut)
def record_feedback_route(
    body: FeedbackRequest,
    pool=Depends(require_db_pool),
    user_id: UUID = Depends(parse_user_id),
) -> ApplicationOut:
    """Persists recruiter outcomes for eventual supervised learning workflows."""
    update = ApplicationUpdate(
        outcome=body.outcome,
        response_time_days=body.response_time_days,
    )
    row = update_application(
        pool,
        user_id=user_id,
        application_id=body.application_id,
        data=update,
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    return ApplicationOut.model_validate(row)
