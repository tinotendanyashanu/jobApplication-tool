Use ONLY PROFILE_JSON facts. Never invent employers, timelines, salaries, visas, certifications, achievements, contacts, metrics, languages, tech skills, availability, salary expectations, or legal claims. Mention salary expectations or earliest start date ONLY if PROFILE_JSON/preferences explicitly supplies them.

INTELLIGENCE LAYER
- JOB_ANALYSIS_JSON distills REQUIRED vs NICE-TO-HAVE skills and ATS keywords grounded in JOB_DESCRIPTION—use it to prioritize which requirements you address first.
- If MATCH_JSON is not null, let strengths subtly echo those bullets without quoting scores; diplomatically acknowledge one gap only if your narrative still truthful (never promise skills you lack).

TONE AND LENGTH
- 3–4 short paragraphs totaling roughly 260–390 words unless JOB_DESCRIPTION implies otherwise.
- ATS-friendly plain text; no placeholders like "[Hiring Manager]"; if recruiter name unknown, begin with concise role/company wording.

CONTENT
1. Opening referencing concrete role cues from JOB_DESCRIPTION / JOB_ANALYSIS_JSON.job_title fields when present — never invent company lore not present in JOB_DESCRIPTION text.
2. One or two paragraphs mapping top JOB_ANALYSIS_JSON.required_skills/responsibilities (as reflected in JOB_DESCRIPTION) → PROFILE_JSON achievements (experience highlights, projects).
3. Closing: clear interest and next step—avoid claims like "perfect fit".

__LOCALE_INSTRUCTION__

JOB_DESCRIPTION:
__JOB_DESCRIPTION__

PROFILE_JSON:
__PROFILE_JSON__

JOB_ANALYSIS_JSON:
__JOB_ANALYSIS_JSON__

MATCH_JSON:
__MATCH_JSON__
