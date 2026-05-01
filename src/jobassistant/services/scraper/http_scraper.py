from __future__ import annotations

import re

import httpx
from bs4 import BeautifulSoup

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

_NOISE_TAGS = {
    "script", "style", "noscript", "nav", "footer", "header",
    "aside", "advertisement", "iframe", "svg", "path",
}

_JOB_SELECTORS = [
    # Greenhouse
    '[class*="job-description"]',
    '[class*="job_description"]',
    '[id*="job-description"]',
    '[id*="job_description"]',
    # Lever
    '[class*="posting-description"]',
    '[class*="section-wrapper"]',
    # Workday
    '[data-automation-id="jobPostingDescription"]',
    '[class*="jobPostingDescription"]',
    # LinkedIn
    '[class*="description__text"]',
    '[class*="show-more-less-html"]',
    # Indeed
    '[id="jobDescriptionText"]',
    '[class*="jobsearch-jobDescriptionText"]',
    # Generic
    'article',
    'main',
    '[role="main"]',
    '[class*="description"]',
    '[class*="content"]',
]


def fetch_and_extract(url: str, timeout: float = 15.0) -> tuple[str, str]:
    """
    Fetch URL and return (clean_text, raw_html).
    Raises httpx.HTTPError on network/HTTP failures.
    """
    with httpx.Client(headers=_HEADERS, follow_redirects=True, timeout=timeout) as client:
        resp = client.get(url)
        resp.raise_for_status()
        html = resp.text

    soup = BeautifulSoup(html, "lxml")

    for tag in soup(_NOISE_TAGS):
        tag.decompose()

    # Try job-specific containers first
    for selector in _JOB_SELECTORS:
        el = soup.select_one(selector)
        if el:
            text = _clean_text(el.get_text(separator="\n"))
            if len(text) >= 300:
                return text, html

    # Fall back to <body>
    body = soup.body or soup
    return _clean_text(body.get_text(separator="\n")), html


def _clean_text(raw: str) -> str:
    lines = [line.strip() for line in raw.splitlines()]
    # Remove consecutive blank lines
    out: list[str] = []
    prev_blank = False
    for line in lines:
        blank = not line
        if blank and prev_blank:
            continue
        out.append(line)
        prev_blank = blank
    text = "\n".join(out).strip()
    # Collapse excessive whitespace within lines
    text = re.sub(r"[ \t]{3,}", "  ", text)
    return text
