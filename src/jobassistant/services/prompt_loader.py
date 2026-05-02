from __future__ import annotations

import json
from importlib import resources

from jobassistant.schemas.generation import Locale
from jobassistant.schemas.intelligence import JobAnalysis, ProfileMatchResponse
from jobassistant.schemas.profile import UserProfile

SHARED_SYSTEM_PROMPT = """You are an expert career writer and meticulous editor.

NON-NEGOTIABLE TRUTHFULNESS
- Only use information supplied in the user message (profile JSON and job description).
- Never invent employers, dates, degrees, certifications, metrics, technologies, or outcomes.
- Do not claim legal status, security clearances, or compensation unless explicitly present in the profile JSON.
- Paraphrase for clarity and relevance; do not copy long spans of the job description verbatim.

FORMATTING
- Output plain text suitable for ATS systems unless the user template requests otherwise.
- Avoid markdown code fences in the final document output.
"""

_LOCALE_LINES: dict[Locale, str] = {
    "en": "Write the entire output in clear, professional English.",
    "pl": "Write the entire output in clear, professional Polish.",
}


def locale_instruction(locale: Locale) -> str:
    return _LOCALE_LINES.get(locale, _LOCALE_LINES["en"])


def _load_template(name: str) -> str:
    root = resources.files("jobassistant.prompts")
    return root.joinpath(name).read_text(encoding="utf-8")


def render_user_prompt(
    template_name: str,
    *,
    profile: UserProfile,
    job_description: str,
    locale: Locale,
    job_analysis: JobAnalysis,
    match_result: ProfileMatchResponse | None = None,
    cv_knowledge_base: list[str] | None = None,
    cv_style_templates: list[str] | None = None,
) -> str:
    template = _load_template(template_name)
    profile_json = json.dumps(
        profile.model_dump(mode="json"),
        ensure_ascii=False,
        indent=2,
    )
    analysis_json = json.dumps(
        job_analysis.model_dump(mode="json"),
        ensure_ascii=False,
        indent=2,
    )
    match_json = (
        json.dumps(match_result.model_dump(mode="json"), ensure_ascii=False, indent=2)
        if match_result
        else "null"
    )
    kb_text = ""
    if cv_knowledge_base:
        kb_text = "\n\n".join(f"--- PREVIOUS CV ---\n{text}" for text in cv_knowledge_base)
    style_text = ""
    if cv_style_templates:
        style_text = "\n\n".join(
            f"--- STYLE TEMPLATE {i + 1} ---\n{text}" for i, text in enumerate(cv_style_templates)
        )
    return (
        template.replace("__PROFILE_JSON__", profile_json)
        .replace("__JOB_DESCRIPTION__", job_description.strip())
        .replace("__JOB_ANALYSIS_JSON__", analysis_json)
        .replace("__MATCH_JSON__", match_json)
        .replace("__LOCALE_INSTRUCTION__", locale_instruction(locale))
        .replace("__CV_KNOWLEDGE_BASE__", kb_text)
        .replace("__CV_STYLE_TEMPLATES__", style_text)
    )
