from __future__ import annotations

from pydantic import BaseModel, Field

from jobassistant.schemas.profile import UserProfile
from jobassistant.schemas.intelligence import JobAnalysis


class AutofillRequest(BaseModel):
    profile: UserProfile
    job_analysis: JobAnalysis | None = None
    cv_text: str | None = None
    cover_letter_text: str | None = None


class AutofillField(BaseModel):
    key: str
    label: str
    value: str
    category: str
    multiline: bool = False
    hint: str = ""


class AutofillResponse(BaseModel):
    fields: list[AutofillField] = Field(default_factory=list)
    years_of_experience: int | None = None
    primary_skills: list[str] = Field(default_factory=list)
