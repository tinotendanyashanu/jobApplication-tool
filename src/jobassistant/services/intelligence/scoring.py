from __future__ import annotations

import math
import re
from typing import Iterable

from jobassistant.schemas.intelligence import ExperienceLevel, JobAnalysis
from jobassistant.schemas.profile import SkillItem, UserProfile

_LEVEL_WEIGHT: dict[ExperienceLevel, int] = {
    "intern": 0,
    "junior": 1,
    "mid": 2,
    "senior": 3,
    "lead": 4,
    "unknown": 2,
}

_TITLE_MARKERS: list[tuple[re.Pattern[str], ExperienceLevel]] = [
    (re.compile(r"\b(intern|internship)\b", re.I), "intern"),
    (re.compile(r"\b(junior|jr\.?|entry)\b", re.I), "junior"),
    (re.compile(r"\b(mid|intermediate|ii\b|2\b)\b", re.I), "mid"),
    (re.compile(r"\b(senior|sr\.?|iii\b|staff|principal)\b", re.I), "senior"),
    (re.compile(r"\b(lead|head|director|chief)\b", re.I), "lead"),
]


def _normalize_token(value: str) -> str:
    return re.sub(r"[^a-z0-9\+#]+", " ", value.lower()).strip()


def profile_text_blob(profile: UserProfile) -> str:
    parts: list[str] = []
    if profile.summary:
        parts.append(profile.summary)
    if profile.full_name:
        parts.append(profile.full_name)
    for skill in profile.skills or []:
        if isinstance(skill, str):
            parts.append(skill)
        elif isinstance(skill, SkillItem):
            parts.append(skill.name)
            if skill.level:
                parts.append(skill.level)
    for role in profile.experience or []:
        parts.extend(
            [
                role.title,
                role.company,
                role.location,
                " ".join(role.highlights or []),
            ]
        )
    for proj in profile.projects or []:
        parts.extend([proj.name, proj.description or "", " ".join(proj.tech or [])])
    for edu in profile.education or []:
        parts.extend([edu.degree, edu.institution])
    if profile.preferences and profile.preferences.target_roles:
        parts.extend(profile.preferences.target_roles)
    blob = " \n ".join(filter(None, parts))
    return _normalize_token(blob)


def infer_profile_level(profile: UserProfile) -> ExperienceLevel:
    titles = " ".join(
        (role.title or "") + " " + (role.company or "")
        for role in profile.experience or []
    ).lower()
    best: ExperienceLevel = "unknown"
    best_rank = -1
    for pattern, lvl in _TITLE_MARKERS:
        if pattern.search(titles) and _LEVEL_WEIGHT[lvl] >= best_rank:
            best_rank = _LEVEL_WEIGHT[lvl]
            best = lvl

    yrs = approximate_years_experience(profile)
    if yrs is not None:
        inferred: ExperienceLevel
        if yrs < 1:
            inferred = "intern"
        elif yrs < 3:
            inferred = "junior"
        elif yrs < 6:
            inferred = "mid"
        elif yrs < 10:
            inferred = "senior"
        else:
            inferred = "lead"
        if _LEVEL_WEIGHT[inferred] > best_rank:
            best = inferred
    return best


def approximate_years_experience(profile: UserProfile) -> float | None:
    """Rough duration from yyyy-mm style strings — best-effort only."""

    spans: list[tuple[int, int]] = []
    for role in profile.experience or []:
        start = _parse_year(role.start)
        end = _parse_year(role.end)
        if start is None:
            continue
        if end is None:
            end = start
        if end < start:
            end = start
        spans.append((start, end))
    if not spans:
        return None
    span_years = sum(max(1.0, float(e - s + 1)) for s, e in spans)
    return min(span_years, 22.0)


def _parse_year(raw: str | None) -> int | None:
    if not raw:
        return None
    text = raw.lower().strip()
    if text in {"present", "now", "current", "ongoing"}:
        from datetime import datetime

        return datetime.now().year
    match = re.search(r"(20\d{2}|19\d{2})", text)
    if match:
        return int(match.group(1))
    return None


def _list_coverage(requirements: Iterable[str], blob: str) -> float:
    items = [item for item in requirements if item.strip()]
    if not items:
        return 42.0
    hits = 0
    for item in items:
        token = _normalize_token(item)
        if not token:
            continue
        if len(token) <= 3:
            if re.search(rf"\b{re.escape(token)}\b", blob):
                hits += 1
        elif token in blob:
            hits += 1
    ratio = hits / len(items)
    # Calibrated: require strong overlap for high score
    return min(100.0, round(100.0 * math.sqrt(ratio)))


def skill_match_score(profile: UserProfile, analysis: JobAnalysis) -> int:
    blob = profile_text_blob(profile)
    coverage = _list_coverage(analysis.required_skills[:40], blob)
    return int(max(0, min(100, coverage)))


def keyword_match_score(profile: UserProfile, analysis: JobAnalysis) -> int:
    blob = profile_text_blob(profile)
    return int(_list_coverage(analysis.keywords[:25], blob))


def experience_alignment_score(profile: UserProfile, analysis: JobAnalysis) -> int:
    job_level = analysis.experience_level
    inferred = infer_profile_level(profile)
    if job_level == "unknown":
        # Stay conservative whenever the JD does not articulate level cues.
        return 52
    delta = abs(_LEVEL_WEIGHT[job_level] - _LEVEL_WEIGHT[inferred])
    base = 100 - delta * 35
    if delta == 1:
        base = max(base, 68)
    if delta >= 3:
        base = min(base, 42)
    return int(max(18, min(100, base)))


def weighted_match_score(
    skill_component: float,
    keyword_component: float,
    experience_component: float,
    *,
    w_skill: float = 0.45,
    w_keyword: float = 0.30,
    w_experience: float = 0.25,
) -> int:
    """Blend subscores — conservative tuning for MVP."""

    total = (
        w_skill * skill_component
        + w_keyword * keyword_component
        + w_experience * experience_component
    )
    calibrated = math.pow(total / 100.0, 1.08) * 100.0  # soften optimism slightly
    return int(max(0, min(100, round(calibrated))))
