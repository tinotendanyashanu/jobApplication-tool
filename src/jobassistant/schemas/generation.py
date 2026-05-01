from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from jobassistant.schemas.intelligence import JobAnalysis, ProfileMatchResponse
from jobassistant.schemas.profile import UserProfile

Locale = Literal["en", "pl"]


class GenerateRequest(BaseModel):
    profile: UserProfile
    job_description: str = Field(..., min_length=1)
    job_link: str | None = Field(
        default=None,
        description="Optional posting URL; appended as context alongside the pasted description.",
    )
    job_analysis: JobAnalysis | None = Field(
        default=None,
        description="Structured posting intel. When omitted the server derives it automatically.",
    )
    match_result: ProfileMatchResponse | None = Field(
        default=None,
        description="Deterministic scoring + narratives. Omit to compute only when prompts request it.",
    )
    include_match_in_prompts: bool = Field(
        default=False,
        description="When true (and match_result omitted) the server computes match narratives for prompts.",
    )
    locale: Locale = "en"
    """Output language for generated documents."""
    model: str | None = Field(
        default=None,
        description="OpenAI model id; falls back to settings when omitted.",
    )


class GenerateMeta(BaseModel):
    model: str
    locale: Locale
    job_analysis: JobAnalysis | None = None
    match_result: ProfileMatchResponse | None = None


class GenerateResponse(BaseModel):
    cv_text: str
    cover_letter_text: str
    meta: GenerateMeta


class SingleGenerateResponse(BaseModel):
    """Response for standalone CV or cover-letter generation."""

    text: str
    meta: GenerateMeta
