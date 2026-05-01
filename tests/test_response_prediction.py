from __future__ import annotations

from datetime import datetime, timezone

from jobassistant.schemas.intelligence import JobAnalysis
from jobassistant.schemas.prediction import MatchScoresPayload, PredictResponseRequest
from jobassistant.schemas.profile import UserProfile
from jobassistant.services.intelligence.response_prediction import run_response_prediction


def test_rule_based_prediction_is_bounded() -> None:
    req = PredictResponseRequest(
        profile=UserProfile(
            full_name="Test User",
            skills=["Python"],
            experience=[
                {
                    "title": "Engineer",
                    "company": "Acme",
                    "start": "2020",
                    "end": "present",
                    "highlights": [],
                }
            ],
        ),
        job_analysis=JobAnalysis(
            required_skills=["Python"],
            keywords=["pytest"],
            experience_level="mid",
        ),
        match_scores=MatchScoresPayload(skill_match=80, experience_match=70, keyword_match=60),
        strengths=["Hands-on Python shipping"],
        gaps=["No explicit cloud certification"],
        application={
            "listing_posted_at": datetime(2026, 4, 20, tzinfo=timezone.utc),
            "applied_at": datetime(2026, 4, 21, tzinfo=timezone.utc),
        },
    )
    res = run_response_prediction(req, now=datetime(2026, 4, 22, tzinfo=timezone.utc))
    assert 0 <= res.response_probability <= 100
    assert res.confidence_level in {"low", "medium", "high"}
    assert all(0 <= v <= 100 for v in res.factors.model_dump().values())
    assert res.insights
    assert res.recommendations
