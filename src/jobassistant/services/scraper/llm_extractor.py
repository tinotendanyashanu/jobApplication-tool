from __future__ import annotations

from jobassistant.services.llm import OpenAIClient

_SYSTEM = """\
You are a job-posting extraction assistant.
Given raw text scraped from a job listing page, extract the job posting content.

RULES
- Output ONLY the cleaned job description as plain text (no JSON, no markdown fences).
- Preserve the structure: title, responsibilities, requirements, nice-to-haves, benefits.
- Remove navigation, cookie notices, social share buttons, legal footers, ads.
- If the page is not a job posting (blocked, login-wall, 404), respond with exactly: __NOT_A_JOB__
- Keep your output under 3000 characters; trim marketing fluff."""

_USER_TEMPLATE = """\
URL: {url}

RAW PAGE TEXT (first 6000 chars):
{text}"""


def extract_job_text(
    *,
    llm: OpenAIClient,
    url: str,
    raw_text: str,
    model: str,
) -> str | None:
    """
    Use LLM to extract clean job description from raw scraped text.
    Returns None if the page is not a valid job posting.
    """
    user = _USER_TEMPLATE.format(url=url, text=raw_text[:6000])
    result = llm.complete(
        system=_SYSTEM,
        user=user,
        model=model,
        temperature=0.1,
        max_tokens=2048,
    )
    if result.strip() == "__NOT_A_JOB__":
        return None
    return result.strip()
