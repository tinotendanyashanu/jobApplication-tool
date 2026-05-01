from __future__ import annotations

from datetime import datetime, timezone

from jobassistant.schemas.intelligence import ExperienceLevel, JobAnalysis
from jobassistant.schemas.prediction import (
    ApplicationMetadataPayload,
    ConfidenceLevel,
    MatchScoresPayload,
    PredictionFactors,
    PredictResponseRequest,
    PredictResponseResponse,
)
from jobassistant.schemas.profile import UserProfile
from jobassistant.services.intelligence.scoring import (
    _LEVEL_WEIGHT,
    experience_alignment_score,
    infer_profile_level,
    keyword_match_score,
    skill_match_score,
)

W_SKILL = 0.30
W_EXPERIENCE = 0.25
W_KEYWORD = 0.20
W_FRESH = 0.15
W_COMPETITION = 0.10

_NEUTRAL_FRESHNESS = 55


def _competition_environment_factor(job_level: ExperienceLevel) -> int:
    """
    User-facing factor named `competition_level` meaning *candidate-side ease* —
    larger values imply comparatively fewer applicants chasing the band (still coarse).
    """

    return {
        "intern": 40,
        "junior": 44,
        "mid": 55,
        "senior": 66,
        "lead": 64,
        "unknown": 52,
    }[job_level]


def _listing_age_days(listing_posted_at: datetime, now: datetime) -> float:
    posted = listing_posted_at
    if posted.tzinfo is None:
        posted = posted.replace(tzinfo=timezone.utc)
    cmp_now = now
    if cmp_now.tzinfo is None:
        cmp_now = cmp_now.replace(tzinfo=timezone.utc)
    return max(0.0, (cmp_now - posted).total_seconds() / 86400.0)


def _freshness_component(
    application: ApplicationMetadataPayload | None,
    *,
    now: datetime,
) -> tuple[int, bool]:
    """
    Returns freshness score plus whether posting date was observable.
    """

    if (
        application is None
        or application.listing_posted_at is None
    ):
        return _NEUTRAL_FRESHNESS, False

    days = _listing_age_days(application.listing_posted_at, now)

    def _baseline(age_days: float) -> int:
        if age_days <= 3:
            return 92
        if age_days <= 7:
            return 84
        if age_days <= 14:
            return 76
        if age_days <= 30:
            return 62
        if age_days <= 60:
            return 46
        return 34

    base = _baseline(days)
    timing_boost = 0
    applied = application.applied_at
    if applied is not None:
        post = application.listing_posted_at
        if applied.tzinfo is None:
            applied = applied.replace(tzinfo=timezone.utc)
        if post.tzinfo is None:
            post = post.replace(tzinfo=timezone.utc)
        latency_h = max(0.0, (applied - post).total_seconds() / 3600.0)
        if latency_h <= 72:
            timing_boost = 10
        elif latency_h <= 168:
            timing_boost = 6
        elif latency_h <= 336:
            timing_boost = 3

    return int(min(100, base + timing_boost)), True


def _resolve_skill_score(
    profile: UserProfile,
    analysis: JobAnalysis,
    payload: MatchScoresPayload | None,
) -> tuple[int, bool]:
    """second value: indicates explicit Phase score used."""
    if payload and payload.skill_match is not None:
        return int(payload.skill_match), True
    return skill_match_score(profile, analysis), False


def _resolve_experience_score(
    profile: UserProfile,
    analysis: JobAnalysis,
    payload: MatchScoresPayload | None,
) -> tuple[int, bool]:
    if payload and payload.experience_match is not None:
        return int(payload.experience_match), True
    return experience_alignment_score(profile, analysis), False


def _resolve_keyword_score(
    profile: UserProfile,
    analysis: JobAnalysis,
    payload: MatchScoresPayload | None,
) -> tuple[int, bool]:
    if payload and payload.keyword_match is not None:
        return int(payload.keyword_match), True
    return keyword_match_score(profile, analysis), False


def _confidence(
    *,
    listing_observed: bool,
    used_phase_skill: bool,
    used_phase_exp: bool,
    used_phase_kw: bool,
    gap_count: int,
) -> tuple[ConfidenceLevel, list[str]]:
    notes: list[str] = []
    score = 3
    if listing_observed:
        score += 1
    else:
        notes.append("Posting date missing — freshness uses a neutral prior.")
    if used_phase_skill and used_phase_exp and used_phase_kw:
        score += 2
    else:
        missing = []
        if not used_phase_skill:
            missing.append("skill")
        if not used_phase_exp:
            missing.append("experience")
        if not used_phase_kw:
            missing.append("keyword")
        notes.append(
            "Some subscores were inferred locally instead of reusing Phase 3 values: "
            + ", ".join(missing)
            + "."
        )
    if gap_count >= 4:
        score -= 1
        notes.append("Several fit gaps were recorded — treat the band as wide.")

    if score >= 5:
        return "high", notes
    if score >= 3:
        return "medium", notes
    return "low", notes


def _build_narrative(
    *,
    factors: PredictionFactors,
    strengths: list[str],
    gaps: list[str],
    job_level: ExperienceLevel,
    profile_level: ExperienceLevel,
) -> tuple[list[str], list[str]]:
    insights: list[str] = []
    recs: list[str] = []

    if strengths:
        insights.append(f"Strongest documented fits echo: {strengths[0]}")
    if len(strengths) > 1:
        insights.append(f"Secondary strength to lean on: {strengths[1]}")

    delta = abs(_LEVEL_WEIGHT[job_level] - _LEVEL_WEIGHT[profile_level])
    if delta >= 2:
        insights.append(
            f"Seniority delta is wide (role targets {job_level}, profile reads closer to "
            f"{profile_level}) — hiring teams may screen harder on proof."
        )
        recs.append(
            "Add one quantified win that matches the role's scope so reviewers see seniority parity."
        )
    elif delta == 0:
        insights.append("Seniority band appears aligned with the posting language.")

    if factors.skill_match < 48:
        insights.append("Skill overlap is below the comfort band for automated shortlists.")
        recs.append("Surface at least two missing must-have skills with proof in your CV or projects.")
    elif factors.skill_match >= 78:
        insights.append("Skill overlap is a credible strength for first-pass filters.")

    if factors.keyword_match < 45:
        recs.append(
            "Echo 4–6 JD keywords verbatim in your headline, skills block, and first bullet cluster."
        )

    if factors.job_freshness >= 80:
        insights.append("Listing looks fresh — response cycles are often faster while hiring is active.")
    elif factors.job_freshness <= 44:
        insights.append("Listing age or timing suggests the role may already be deep in process.")
        recs.append("If you still apply, lead with a crisp differentiator in the first 3 lines.")

    if factors.competition_level <= 48:
        insights.append(
            "Entry / junior bands attract more volume — clarity and proof matter more than buzzwords."
        )

    for tip in gaps[:2]:
        insights.append(f"Risk called out earlier in matching: {tip}")

    if not recs:
        recs.extend(
            [
                "Reuse the JD's verbs in accomplishment bullets tied to measurable outcomes.",
                "Send applications within ~3 days of posting when possible to ride early pipeline effects.",
            ]
        )
    else:
        recs.append(
            "Keep a short cover letter hook that maps your top strength to the company's stated pain."
        )

    # De-duplicate while preserving order
    def _dedupe(seq: list[str]) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for item in seq:
            key = item.strip()
            if key and key not in seen:
                seen.add(key)
                out.append(item)
        return out

    return _dedupe(insights), _dedupe(recs)


def run_response_prediction(
    request: PredictResponseRequest,
    *,
    now: datetime | None = None,
) -> PredictResponseResponse:
    now = now or datetime.now(timezone.utc)
    analysis = request.job_analysis
    profile = request.profile
    payload = request.match_scores

    skill, used_s = _resolve_skill_score(profile, analysis, payload)
    experience, used_e = _resolve_experience_score(profile, analysis, payload)
    keyword, used_k = _resolve_keyword_score(profile, analysis, payload)

    fresh, listing_observed = _freshness_component(request.application, now=now)
    competition = _competition_environment_factor(analysis.experience_level)

    blended = (
        W_SKILL * skill
        + W_EXPERIENCE * experience
        + W_KEYWORD * keyword
        + W_FRESH * fresh
        + W_COMPETITION * competition
    )
    probability = int(max(0, min(100, round(blended))))

    factors = PredictionFactors(
        skill_match=skill,
        experience_match=experience,
        keyword_match=keyword,
        job_freshness=fresh,
        competition_level=competition,
    )

    conf, conf_notes = _confidence(
        listing_observed=listing_observed,
        used_phase_skill=used_s,
        used_phase_exp=used_e,
        used_phase_kw=used_k,
        gap_count=len(request.gaps),
    )

    profile_level = infer_profile_level(profile)
    insights, recs = _build_narrative(
        factors=factors,
        strengths=[s for s in request.strengths if s.strip()],
        gaps=request.gaps,
        job_level=analysis.experience_level,
        profile_level=profile_level,
    )

    insights = conf_notes + insights

    return PredictResponseResponse(
        response_probability=probability,
        confidence_level=conf,
        factors=factors,
        insights=insights[:10],
        recommendations=recs[:8],
    )
