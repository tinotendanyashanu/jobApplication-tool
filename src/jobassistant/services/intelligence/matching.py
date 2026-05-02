from __future__ import annotations

import json
from importlib import resources
from typing import Iterable

from jobassistant.schemas.intelligence import JobAnalysis, ProfileMatchResponse
from jobassistant.schemas.profile import UserProfile
from jobassistant.services.intelligence.scoring import (
    experience_alignment_score,
    keyword_match_score,
    skill_match_score,
    weighted_match_score,
)
from jobassistant.services.json_utils import parse_json_object
from jobassistant.services.llm import OpenAIClient

MATCH_SYSTEM_PROMPT = """You are an evidence-based recruiter coach assisting a candidate review.

RULES
- Output ONLY JSON (no prose) following the user's schema specification.
- Every narrative bullet must cite evidence from PROFILE_JSON or JOB_ANALYSIS_JSON explicitly.
- Do not promise outcomes; keep tone candid and calibrated to SYSTEM_SCORES_JSON.
"""

USER_TEMPLATE = "match_narrative.md"


def _template() -> str:
    root = resources.files("jobassistant.prompts")
    return root.joinpath(USER_TEMPLATE).read_text(encoding="utf-8")


def run_profile_match(
    *,
    llm: OpenAIClient,
    profile: UserProfile,
    analysis: JobAnalysis,
    model: str,
) -> ProfileMatchResponse:
    skill = skill_match_score(profile, analysis)
    keyword = keyword_match_score(profile, analysis)
    experience = experience_alignment_score(profile, analysis)
    overall = weighted_match_score(skill, keyword, experience)

    scores_snapshot = json.dumps(
        {
            "skill_match_score": skill,
            "keyword_match_score": keyword,
            "experience_match_score": experience,
            "match_score": overall,
        },
        ensure_ascii=False,
    )

    tpl = _template()
    payload = tpl.replace("__JOB_ANALYSIS_JSON__", _dump_json(analysis)).replace(
        "__PROFILE_JSON__", json.dumps(profile.model_dump(mode="json"), ensure_ascii=False, indent=2)
    ).replace("__SYSTEM_SCORES_JSON__", scores_snapshot)

    raw = llm.complete_json(
        system=MATCH_SYSTEM_PROMPT,
        user=payload,
        model=model,
        temperature=0.25,
        max_tokens=2048,
    )
    narratives = parse_json_object(raw)

    strengths = _limit_list(str(x) for x in narratives.get("strengths", []) if str(x).strip())
    gaps = _limit_list(str(x) for x in narratives.get("gaps", []) if str(x).strip())
    recs = _limit_list(str(x) for x in narratives.get("recommendations", []) if str(x).strip())

    return ProfileMatchResponse(
        match_score=overall,
        skill_match_score=skill,
        experience_match_score=experience,
        keyword_match_score=keyword,
        strengths=strengths,
        gaps=gaps,
        recommendations=recs,
    )


def _dump_json(analysis: JobAnalysis) -> str:
    return json.dumps(analysis.model_dump(mode="json"), ensure_ascii=False, indent=2)


def _limit_list(values: Iterable[str], max_items: int = 6) -> list[str]:
    out: list[str] = []
    for val in values:
        cleaned = " ".join(val.split())
        if not cleaned:
            continue
        out.append(cleaned[:320])
        if len(out) >= max_items:
            break
    return out
