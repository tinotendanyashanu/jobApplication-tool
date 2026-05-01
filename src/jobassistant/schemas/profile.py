from __future__ import annotations

from pydantic import BaseModel, Field


class ProfileLink(BaseModel):
    label: str = ""
    url: str


class ExperienceItem(BaseModel):
    title: str
    company: str = ""
    location: str = ""
    start: str = ""
    end: str = ""
    highlights: list[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    degree: str
    institution: str = ""
    year: str = ""


class SkillItem(BaseModel):
    """Either use `name` or pass a plain string in JSON (coerced via union on parent)."""

    name: str
    level: str = ""


class ProjectItem(BaseModel):
    name: str
    description: str = ""
    tech: list[str] = Field(default_factory=list)
    url: str | None = None


class LanguageItem(BaseModel):
    language: str
    proficiency: str = ""


class Preferences(BaseModel):
    target_roles: list[str] = Field(default_factory=list)
    industries: list[str] = Field(default_factory=list)
    salary_expectation: str = ""
    availability: str = ""


class UserProfile(BaseModel):
    """Structured candidate profile shared by CLI and API."""

    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    links: list[ProfileLink] = Field(default_factory=list)
    summary: str = ""

    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    skills: list[str | SkillItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    languages: list[LanguageItem] = Field(default_factory=list)

    preferences: Preferences | None = None
