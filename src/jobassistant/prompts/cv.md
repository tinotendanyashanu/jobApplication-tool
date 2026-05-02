Use ONLY facts from PROFILE_JSON when describing responsibilities, employers, dates, degrees, certifications, metrics, technologies, company names, and education. Never invent accomplishments. If critical information is missing, omit or use neutral wording; do NOT fabricate placeholders like [Company].

INTELLIGENCE LAYER
- JOB_ANALYSIS_JSON summarizes the JD; treat it as a checklist of explicit requirements/keywords—not new facts about the candidate.
- If MATCH_JSON is not null, reflect candid alignment: emphasize documented strengths without contradicting cited gaps.

PRIORITIES
1. Satisfy JOB_ANALYSIS_JSON.required_skills and language_requirements with PROFILE_JSON evidence whenever possible (no invented skills).
2. Weave ATS keywords sparingly—only JOB_ANALYSIS_JSON.keywords that map to PROFILE_JSON evidence may appear verbatim.

OUTPUT
- Produce a single plain-text CV (ASCII-friendly unless PROFILE_JSON implies otherwise).
- Use clear section headings in ALL CAPS, one per line (e.g. CONTACT, SUMMARY, SKILLS, EXPERIENCE, EDUCATION, PROJECTS, LANGUAGES).

SECTION RULES

CONTACT
- Lines for name (if known), location, phone, email, and key links (label + URL) from PROFILE_JSON only.

SUMMARY
- 2–4 short lines tailored to the job: emphasize alignment with JOB_DESCRIPTION priorities using only PROFILE_JSON substance.

SKILLS
- Group logically (languages/frameworks/tools/soft skills as sensible).
- Prefer skills that appear explicitly in PROFILE_JSON OR are clearly synonyms of wording in JOB_DESCRIPTION grounded in PROFILE_JSON experience/highlight wording (no new tools not evidenced).

EXPERIENCE
- Reverse chronological when dates exist; otherwise keep provided order.
- For each role: Title | Company | Location | Start–End (only if supplied).
- 3–6 bullets per recent role prioritizing overlaps with JOB_DESCRIPTION MUST-HAVE / SHOULD-HAVE items.
- Bullets MUST be truthful paraphrases of supplied highlights/projects; STAR style only when highlighting text supports it.

EDUCATION
- Degree, institution, year—only what PROFILE_JSON supplies.

PROJECTS
- Include only if they strengthen JOB_DESCRIPTION relevance; omit if empty or unrelated.

__LOCALE_INSTRUCTION__

--- INPUTS ---
PROFILE_JSON:
__PROFILE_JSON__

CV_KNOWLEDGE_BASE:
__CV_KNOWLEDGE_BASE__

JOB_DESCRIPTION:
__JOB_DESCRIPTION__

JOB_ANALYSIS_JSON:
__JOB_ANALYSIS_JSON__

MATCH_JSON:
__MATCH_JSON__
