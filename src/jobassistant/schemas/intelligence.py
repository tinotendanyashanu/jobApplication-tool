from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from jobassistant.schemas.profile import UserProfile

ExperienceLevel = Literal["intern", "junior", "mid", "senior", "lead", "unknown"]


class JobAnalysis(BaseModel):
    """Structured extraction grounded in the posting text."""

    job_title: str | None = None
    company_name: str | None = None
    required_skills: list[str] = Field(default_factory=list)
    nice_to_have_skills: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(
        default_factory=list,
        description="ATS-style keywords or phrases visible in the posting.",
    )
    experience_level: ExperienceLevel = "unknown"
    language_requirements: list[str] = Field(default_factory=list)
    location: str | None = None
    summary: str = Field(
        default="",
        description="2–4 sentences summarizing the role using only supplied text.",
    )


class AnalyzeJobRequest(BaseModel):
    job_description: str = Field(..., min_length=1)
    model: str | None = None


class AnalyzeJobResponse(BaseModel):
    analysis: JobAnalysis
    model_name: str


class MatchProfileRequest(BaseModel):
    profile: UserProfile
    job_analysis: JobAnalysis
    model: str | None = None


class ProfileMatchResponse(BaseModel):
    """Deterministic subscores + grounded narrative lists."""

    match_score: int = Field(..., ge=0, le=100)
    skill_match_score: int = Field(..., ge=0, le=100)
    experience_match_score: int = Field(..., ge=0, le=100)
    keyword_match_score: int = Field(..., ge=0, le=100)
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
