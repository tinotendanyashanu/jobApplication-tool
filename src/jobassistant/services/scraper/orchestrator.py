from __future__ import annotations

import httpx

from jobassistant.config import Settings, default_llm_model
from jobassistant.schemas.scrape import ScrapeResult
from jobassistant.services.llm import OpenAIClient
from jobassistant.services.scraper.http_scraper import fetch_and_extract
from jobassistant.services.scraper.llm_extractor import extract_job_text

# Minimum chars of raw text before we try LLM cleanup
_MIN_RAW_FOR_LLM = 200
# If raw text is this thin, the page was likely JS-rendered or blocked
_THIN_PAGE_THRESHOLD = 500


def scrape_job_url(
    *,
    url: str,
    llm: OpenAIClient,
    settings: Settings,
) -> ScrapeResult:
    model = default_llm_model(settings)

    # Step 1: HTTP fetch + HTML text extraction
    raw_text = ""
    fetch_error: str | None = None
    try:
        raw_text, _ = fetch_and_extract(url)
    except httpx.HTTPStatusError as exc:
        fetch_error = f"HTTP {exc.response.status_code} from {url}"
    except httpx.RequestError as exc:
        fetch_error = f"Network error: {exc}"
    except Exception as exc:  # noqa: BLE001
        fetch_error = str(exc)

    if fetch_error and not raw_text:
        return ScrapeResult(
            url=url,
            success=False,
            error=fetch_error,
            method="http",
        )

    # Step 2: LLM-assisted extraction to get clean job description
    if len(raw_text) >= _MIN_RAW_FOR_LLM:
        try:
            cleaned = extract_job_text(
                llm=llm,
                url=url,
                raw_text=raw_text,
                model=model,
            )
        except Exception as exc:  # noqa: BLE001
            cleaned = None
            # LLM failed — fall through to raw text
            _ = exc

        if cleaned is not None:
            return ScrapeResult(
                url=url,
                job_description=cleaned,
                raw_text=raw_text,
                method="llm_extract",
                success=True,
                char_count=len(cleaned),
            )

    # Step 3: Return raw text as fallback (better than nothing)
    if raw_text:
        return ScrapeResult(
            url=url,
            job_description=raw_text[:4000],
            raw_text=raw_text,
            method="fallback_text",
            success=True,
            char_count=len(raw_text),
            error="LLM extraction unavailable; raw text may include page noise — please trim." if not fetch_error else fetch_error,
        )

    return ScrapeResult(
        url=url,
        success=False,
        error=fetch_error or "Could not extract any text from page.",
        method="http",
    )
