/** Mirrors `jobassistant.schemas.profile` / FastAPI JSON. */

export type ProfileLink = {
  label?: string;
  url: string;
};

export type ExperienceItem = {
  title: string;
  company?: string;
  location?: string;
  start?: string;
  end?: string;
  highlights?: string[];
};

export type EducationItem = {
  degree: string;
  institution?: string;
  year?: string;
};

export type SkillEntry = string | { name: string; level?: string };

export type ProjectItem = {
  name: string;
  description?: string;
  tech?: string[];
  url?: string | null;
};

export type LanguageItem = {
  language: string;
  proficiency?: string;
};

export type Preferences = {
  target_roles?: string[];
  industries?: string[];
  salary_expectation?: string;
  availability?: string;
};

export type UserProfile = {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: ProfileLink[];
  summary?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: SkillEntry[];
  projects?: ProjectItem[];
  languages?: LanguageItem[];
  preferences?: Preferences | null;
};

export type LocaleCode = "en" | "pl";

export type GeneratePayload = {
  profile: UserProfile;
  job_description: string;
  job_link?: string | null;
  locale?: LocaleCode;
  model?: string | null;
  include_match_in_prompts?: boolean;
};

export type JobAnalysisMeta = {
  job_title?: string | null;
  company_name?: string | null;
  required_skills?: string[];
  nice_to_have_skills?: string[];
  keywords?: string[];
  experience_level?: string;
  language_requirements?: string[];
  location?: string | null;
  summary?: string;
};

export type ProfileMatchMeta = {
  match_score: number;
  skill_match_score: number;
  experience_match_score: number;
  keyword_match_score: number;
  strengths: string[];
  gaps: string[];
  recommendations?: string[];
};

export type GenerateMeta = {
  model: string;
  locale: LocaleCode;
  job_analysis?: JobAnalysisMeta | null;
  match_result?: ProfileMatchMeta | null;
};

export type SingleGenerateResponse = {
  text: string;
  meta: GenerateMeta;
};
