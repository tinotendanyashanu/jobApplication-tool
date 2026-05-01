from __future__ import annotations

from datetime import date

from jobassistant.schemas.autofill import AutofillField, AutofillResponse
from jobassistant.schemas.intelligence import JobAnalysis
from jobassistant.schemas.profile import UserProfile


def build_autofill_response(
    *,
    profile: UserProfile,
    job_analysis: JobAnalysis | None = None,
    cv_text: str | None = None,
    cover_letter_text: str | None = None,
) -> AutofillResponse:
    fields: list[AutofillField] = []

    # ── Contact ───────────────────────────────────────────────────────────────
    if profile.full_name:
        parts = profile.full_name.strip().split(maxsplit=1)
        fields.append(AutofillField(key="first_name", label="First Name", value=parts[0], category="contact"))
        fields.append(AutofillField(key="last_name", label="Last Name", value=parts[1] if len(parts) > 1 else "", category="contact"))
        fields.append(AutofillField(key="full_name", label="Full Name", value=profile.full_name.strip(), category="contact"))

    if profile.email:
        fields.append(AutofillField(key="email", label="Email", value=profile.email.strip(), category="contact"))

    if profile.phone:
        fields.append(AutofillField(key="phone", label="Phone", value=profile.phone.strip(), category="contact"))

    if profile.location:
        fields.append(AutofillField(key="location", label="Location / City", value=profile.location.strip(), category="contact"))

    # ── Links ────────────────────────────────────────────────────────────────
    for link in profile.links or []:
        label_lower = (link.label or "").lower()
        if "linkedin" in label_lower:
            fields.append(AutofillField(key="linkedin_url", label="LinkedIn URL", value=link.url, category="links"))
        elif "github" in label_lower:
            fields.append(AutofillField(key="github_url", label="GitHub URL", value=link.url, category="links"))
        elif "portfolio" in label_lower or "website" in label_lower:
            fields.append(AutofillField(key="portfolio_url", label="Portfolio / Website", value=link.url, category="links"))

    # ── Professional summary ─────────────────────────────────────────────────
    if profile.summary:
        fields.append(AutofillField(
            key="summary",
            label="Professional Summary / About",
            value=profile.summary.strip(),
            category="professional",
            multiline=True,
        ))

    # ── Skills ───────────────────────────────────────────────────────────────
    skill_names: list[str] = []
    for s in profile.skills or []:
        skill_names.append(s if isinstance(s, str) else s.name)

    if skill_names:
        fields.append(AutofillField(
            key="skills",
            label="Skills (comma-separated)",
            value=", ".join(skill_names),
            category="professional",
            hint="Paste into a skills field or pick relevant items individually.",
        ))

    # ── Work authorization / availability ────────────────────────────────────
    prefs = profile.preferences
    if prefs:
        if prefs.availability:
            fields.append(AutofillField(
                key="availability",
                label="Availability / Notice Period",
                value=prefs.availability,
                category="preferences",
            ))
        if prefs.salary_expectation:
            fields.append(AutofillField(
                key="salary_expectation",
                label="Salary Expectation",
                value=prefs.salary_expectation,
                category="preferences",
            ))

    # ── Most recent role ─────────────────────────────────────────────────────
    exp = profile.experience or []
    if exp:
        recent = exp[0]
        fields.append(AutofillField(key="current_title", label="Current / Most Recent Title", value=recent.title, category="experience"))
        if recent.company:
            fields.append(AutofillField(key="current_company", label="Current / Most Recent Company", value=recent.company, category="experience"))

    # ── Languages ────────────────────────────────────────────────────────────
    langs = profile.languages or []
    if langs:
        lang_str = ", ".join(
            f"{l.language} ({l.proficiency})" if l.proficiency else l.language
            for l in langs
        )
        fields.append(AutofillField(key="languages", label="Languages", value=lang_str, category="professional"))

    # ── CV / Cover letter text ───────────────────────────────────────────────
    if cv_text:
        fields.append(AutofillField(
            key="cv_text",
            label="CV / Resume Text",
            value=cv_text.strip(),
            category="documents",
            multiline=True,
            hint="Paste into 'Paste your resume' text areas on application forms.",
        ))
    if cover_letter_text:
        fields.append(AutofillField(
            key="cover_letter_text",
            label="Cover Letter Text",
            value=cover_letter_text.strip(),
            category="documents",
            multiline=True,
        ))

    # ── Derived fields ───────────────────────────────────────────────────────
    yoe = _estimate_years_of_experience(exp)
    primary_skills = skill_names[:10]

    if yoe is not None:
        fields.append(AutofillField(
            key="years_of_experience",
            label="Years of Experience",
            value=str(yoe),
            category="professional",
            hint="Approximate total based on your experience entries.",
        ))

    return AutofillResponse(
        fields=fields,
        years_of_experience=yoe,
        primary_skills=primary_skills,
    )


def _estimate_years_of_experience(experience: list) -> int | None:
    if not experience:
        return None
    current_year = date.today().year
    total_months = 0
    for item in experience:
        start = _parse_year_month(getattr(item, "start", None))
        end_raw = getattr(item, "end", None)
        if end_raw and end_raw.strip().lower() not in ("present", "now", "current", ""):
            end = _parse_year_month(end_raw)
        else:
            end = (current_year, 12)
        if start and end:
            months = (end[0] - start[0]) * 12 + (end[1] - start[1])
            total_months += max(0, months)
    if total_months == 0:
        return None
    return max(1, round(total_months / 12))


def _parse_year_month(raw: str | None) -> tuple[int, int] | None:
    if not raw:
        return None
    raw = raw.strip()
    # "YYYY-MM"
    if len(raw) >= 7 and raw[4] == "-":
        try:
            return int(raw[:4]), int(raw[5:7])
        except ValueError:
            pass
    # "YYYY"
    if len(raw) == 4 and raw.isdigit():
        return int(raw), 1
    return None
