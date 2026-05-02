from __future__ import annotations

import json
from importlib import resources

from jobassistant.schemas.intelligence import JobAnalysis
from jobassistant.services.json_utils import parse_json_object
from jobassistant.services.llm import OpenAIClient

ANALYSIS_SYSTEM_PROMPT = """You are an information extraction assistant for recruiters.

IMPORTANT
- Respond with ONLY a valid JSON object (no prose, fences, Markdown).
- Every field MUST be anchored in JOB_DESCRIPTION supplied by the user.
- Prefer null / empty arrays / "unknown" over guessing factual details."""

USER_TEMPLATE_RESOURCE = "job_analysis.md"


def _load_prompt_template() -> str:
    root = resources.files("jobassistant.prompts")
    return root.joinpath(USER_TEMPLATE_RESOURCE).read_text(encoding="utf-8")


def run_job_analysis(
    *,
    llm: OpenAIClient,
    job_description: str,
    model: str,
) -> JobAnalysis:
    template = _load_prompt_template()
    user_payload = template.replace(
        "__JOB_DESCRIPTION__",
        job_description.strip(),
    )
    raw = llm.complete_json(
        system=ANALYSIS_SYSTEM_PROMPT,
        user=user_payload,
        model=model,
        temperature=0.1,
        max_tokens=4096,
    )
    payload = parse_json_object(raw)
    normalized = payload.copy()

    normalized.setdefault("nice_to_have_skills", [])
    normalized.setdefault("required_skills", [])
    normalized.setdefault("keywords", [])
    normalized.setdefault("language_requirements", [])
    normalized.setdefault("summary", "")

    return JobAnalysis.model_validate(normalized)
