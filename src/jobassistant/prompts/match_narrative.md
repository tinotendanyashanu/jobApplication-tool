Return ONLY valid JSON:
{
  "strengths": string[],
  "gaps": string[],
  "recommendations": string[]
}

RULES
- strengths: bullet-quality sentences describing concrete PROFILE ↔ JOB_ANALYSIS alignment (skills, achievements, domains). Max 6 items.
- gaps: truthful missing asks from JOB_ANALYSIS (required skills/experience/language) unsupported by PROFILE evidence. Max 6 items.
- recommendations: practical next steps or résumé tweaks grounded in PROFILE (no hallucinated projects). Max 6 items.
- Do NOT contradict the deterministic scores embedded in SYSTEM_SCORES_JSON; narratives must be consistent with them (do not imply "perfect fit" when scores are mediocre).
- No scores in this JSON (server supplies authoritative numbers separately).

JOB_ANALYSIS_JSON:
__JOB_ANALYSIS_JSON__

PROFILE_JSON:
__PROFILE_JSON__

SYSTEM_SCORES_JSON (authoritative totals already computed server-side — reference only):
__SYSTEM_SCORES_JSON__
