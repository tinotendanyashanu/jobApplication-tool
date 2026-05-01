from __future__ import annotations

from fastapi import APIRouter

from jobassistant.schemas.autofill import AutofillRequest, AutofillResponse
from jobassistant.services.autofill import build_autofill_response

router = APIRouter(tags=["autofill"])


@router.post("/autofill-fields", response_model=AutofillResponse)
def autofill_fields(body: AutofillRequest) -> AutofillResponse:
    return build_autofill_response(
        profile=body.profile,
        job_analysis=body.job_analysis,
        cv_text=body.cv_text,
        cover_letter_text=body.cover_letter_text,
    )
