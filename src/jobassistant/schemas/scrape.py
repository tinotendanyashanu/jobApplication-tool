from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, HttpUrl, Field


ScrapeMethod = Literal["http", "llm_extract", "fallback_text"]


class ScrapeRequest(BaseModel):
    url: str = Field(..., min_length=1)


class ScrapeResult(BaseModel):
    url: str
    job_title: str | None = None
    company_name: str | None = None
    location: str | None = None
    job_description: str = ""
    raw_text: str = ""
    method: ScrapeMethod = "http"
    success: bool = True
    error: str | None = None
    char_count: int = 0
