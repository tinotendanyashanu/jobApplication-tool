from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, status

from jobassistant.api.deps import llm_client, settings_dep
from jobassistant.config import Settings, llm_credentials_configured
from jobassistant.schemas.scrape import ScrapeRequest, ScrapeResult
from jobassistant.services.llm import OpenAIClient
from jobassistant.services.scraper import scrape_job_url

router = APIRouter(tags=["scraper"])


@router.post("/scrape-job", response_model=ScrapeResult)
async def scrape_job(
    body: ScrapeRequest,
    client: OpenAIClient = Depends(llm_client),
    settings: Settings = Depends(settings_dep),
) -> ScrapeResult:
    if not llm_credentials_configured(settings):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No LLM API key configured — set GOOGLE_AI_API_KEY or OPENAI_API_KEY.",
        )

    def _run() -> ScrapeResult:
        return scrape_job_url(url=body.url, llm=client, settings=settings)

    return await asyncio.to_thread(_run)
