export type ScrapeMethod = "http" | "llm_extract" | "fallback_text";

export type ScrapeResult = {
  url: string;
  job_title: string | null;
  company_name: string | null;
  location: string | null;
  job_description: string;
  raw_text: string;
  method: ScrapeMethod;
  success: boolean;
  error: string | null;
  char_count: number;
};

export type AutofillField = {
  key: string;
  label: string;
  value: string;
  category: string;
  multiline: boolean;
  hint: string;
};

export type AutofillResponse = {
  fields: AutofillField[];
  years_of_experience: number | null;
  primary_skills: string[];
};
