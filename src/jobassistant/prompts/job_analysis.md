Return ONLY valid JSON (no markdown) with this exact shape and key names:
{
  "job_title": string | null,
  "company_name": string | null,
  "required_skills": string[],
  "nice_to_have_skills": string[],
  "keywords": string[],
  "experience_level": "intern" | "junior" | "mid" | "senior" | "lead" | "unknown",
  "language_requirements": string[],
  "location": string | null,
  "summary": string
}

RULES
- Ground every field in JOB_DESCRIPTION. If information is missing or ambiguous, use null, empty arrays, "unknown", or neutral summary text that does not invent employers, tech, or benefits.
- Skills must be short noun phrases (e.g., "Python", "Kubernetes", "Stakeholder management") taken from or clearly implied by the posting.
- keywords: important nouns/phrases likely relevant to ATS (stack, domain, certifications) that appear in the posting.
- experience_level: infer cautiously from wording like "Junior", "Mid", "Senior", "Principal", years of experience, or responsibility scope.
- summary: concise (2–4 sentences) recruiter-style recap referencing only JOB_DESCRIPTION substance.

JOB_DESCRIPTION:
__JOB_DESCRIPTION__
