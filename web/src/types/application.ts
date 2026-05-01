export type ApplicationStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "no_response";

export type ApplicationsSort = "date_desc" | "date_asc" | "score_desc" | "score_asc";

export type ConfidenceBand = "low" | "medium" | "high";

export type ApplicationOutcomeFeedback = "response" | "interview" | "rejected" | "none";

export type ApplicationRecord = {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  job_description: string;
  match_score: number | null;
  skill_match: number | null;
  experience_match: number | null;
  keyword_match: number | null;
  strengths: string[];
  gaps: string[];
  cv_text: string;
  cover_letter_text: string;
  status: ApplicationStatus;
  applied_at: string | null;
  response_probability: number | null;
  confidence_level: ConfidenceBand | null;
  outcome: ApplicationOutcomeFeedback | null;
  response_time_days: number | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationCreatePayload = {
  job_title: string;
  company: string;
  job_description: string;
  match_score?: number | null;
  skill_match?: number | null;
  experience_match?: number | null;
  keyword_match?: number | null;
  strengths?: string[];
  gaps?: string[];
  cv_text?: string;
  cover_letter_text?: string;
  status?: ApplicationStatus;
  applied_at?: string | null;
  response_probability?: number | null;
  confidence_level?: ConfidenceBand | null;
  outcome?: ApplicationOutcomeFeedback | null;
  response_time_days?: number | null;
};

export type ApplicationUpdatePayload = Partial<ApplicationCreatePayload>;
