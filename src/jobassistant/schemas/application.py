from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


ApplicationStatus = Literal[
    "saved",
    "applied",
    "interview",
    "offer",
    "rejected",
    "no_response",
]

APPLICATION_STATUSES: tuple[ApplicationStatus, ...] = (
    "saved",
    "applied",
    "interview",
    "offer",
    "rejected",
    "no_response",
)

SortKey = Literal["date_desc", "date_asc", "score_desc", "score_asc"]

ApplicationOutcome = Literal["response", "interview", "rejected", "none"]

ConfidenceLevel = Literal["low", "medium", "high"]


class ApplicationCreate(BaseModel):
    job_title: str = Field(..., min_length=1)
    company: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)
    match_score: int | None = Field(None, ge=0, le=100)
    skill_match: int | None = Field(None, ge=0, le=100)
    experience_match: int | None = Field(None, ge=0, le=100)
    keyword_match: int | None = Field(None, ge=0, le=100)
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    cv_text: str = ""
    cover_letter_text: str = ""
    status: ApplicationStatus = "saved"
    applied_at: datetime | None = None
    response_probability: int | None = Field(None, ge=0, le=100)
    confidence_level: ConfidenceLevel | None = None
    outcome: ApplicationOutcome | None = None
    response_time_days: int | None = Field(None, ge=0)


class ApplicationUpdate(BaseModel):
    job_title: str | None = Field(None, min_length=1)
    company: str | None = Field(None, min_length=1)
    job_description: str | None = Field(None, min_length=1)
    match_score: int | None = Field(None, ge=0, le=100)
    skill_match: int | None = Field(None, ge=0, le=100)
    experience_match: int | None = Field(None, ge=0, le=100)
    keyword_match: int | None = Field(None, ge=0, le=100)
    strengths: list[str] | None = None
    gaps: list[str] | None = None
    cv_text: str | None = None
    cover_letter_text: str | None = None
    status: ApplicationStatus | None = None
    applied_at: datetime | None = None
    response_probability: int | None = Field(None, ge=0, le=100)
    confidence_level: ConfidenceLevel | None = None
    outcome: ApplicationOutcome | None = None
    response_time_days: int | None = Field(None, ge=0)


class ApplicationOut(BaseModel):
    id: UUID
    user_id: UUID
    job_title: str
    company: str
    job_description: str
    match_score: int | None
    skill_match: int | None
    experience_match: int | None
    keyword_match: int | None
    strengths: list[str]
    gaps: list[str]
    cv_text: str
    cover_letter_text: str
    status: ApplicationStatus
    applied_at: datetime | None
    response_probability: int | None
    confidence_level: ConfidenceLevel | None
    outcome: ApplicationOutcome | None
    response_time_days: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": False}

    @field_validator("strengths", "gaps", mode="before")
    @classmethod
    def _coerce_none_lists(cls, v: object) -> object:
        if v is None:
            return []
        return v
