from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from jobassistant.schemas.intelligence import JobAnalysis
from jobassistant.schemas.profile import UserProfile

ConfidenceLevel = Literal["low", "medium", "high"]

FeedbackOutcome = Literal["response", "interview", "rejected", "none"]


class MatchScoresPayload(BaseModel):
    """Scores from Phase 3 matching; omit fields you do not yet have."""

    match_score: int | None = Field(None, ge=0, le=100)
    skill_match: int | None = Field(None, ge=0, le=100)
    experience_match: int | None = Field(None, ge=0, le=100)
    keyword_match: int | None = Field(None, ge=0, le=100)


class ApplicationMetadataPayload(BaseModel):
    """
    Signals for freshness and submission timing.

    listing_posted_at: when the job first appeared if you know it.
    applied_at: when you submitted — early applications get a modest boost vs stale postings.
    """

    listing_posted_at: datetime | None = None
    applied_at: datetime | None = None


class PredictResponseRequest(BaseModel):
    profile: UserProfile
    job_analysis: JobAnalysis
    match_scores: MatchScoresPayload | None = None
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    application: ApplicationMetadataPayload | None = None


class PredictionFactors(BaseModel):
    """Interpretable drivers; all on a 0–100 scale."""

    skill_match: int = Field(..., ge=0, le=100)
    experience_match: int = Field(..., ge=0, le=100)
    keyword_match: int = Field(..., ge=0, le=100)
    job_freshness: int = Field(
        ...,
        ge=0,
        le=100,
        description="Higher when the posting is recent (or neutral when posting date unknown).",
    )
    competition_level: int = Field(
        ...,
        ge=0,
        le=100,
        description="Higher indicates a less overcrowded recruiting band "
        "(heuristic — not empirical applicant counts).",
    )


class PredictResponseResponse(BaseModel):
    """Transparent, rule-based response likelihood — avoids fake decimals."""

    response_probability: int = Field(..., ge=0, le=100)
    confidence_level: ConfidenceLevel
    factors: PredictionFactors
    insights: list[str]
    recommendations: list[str]
    methodology_note: str = Field(
        default="Rule-based MVP: calibrated blend of overlap scores, freshness, timing, "
        "and coarse competition heuristics. Not a calibrated probability model.",
        description="Keeps recruiters and candidates honest about what this number means.",
    )


class FeedbackRequest(BaseModel):
    application_id: UUID
    outcome: FeedbackOutcome
    response_time_days: int | None = Field(None, ge=0, description="Calendar days until first substantive signal.")
