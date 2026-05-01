import type { JobAnalysisMeta, UserProfile } from "@/types/profile";

export type ConfidenceBand = "low" | "medium" | "high";

export type ApplicationOutcome = "response" | "interview" | "rejected" | "none";

export type MatchScoresPayload = {
  match_score?: number | null;
  skill_match?: number | null;
  experience_match?: number | null;
  keyword_match?: number | null;
};

export type ApplicationTimingPayload = {
  listing_posted_at?: string | null;
  applied_at?: string | null;
};

export type PredictResponseRequest = {
  profile: UserProfile;
  job_analysis: JobAnalysisMeta;
  match_scores?: MatchScoresPayload | null;
  strengths?: string[];
  gaps?: string[];
  application?: ApplicationTimingPayload | null;
};

export type PredictionFactors = {
  skill_match: number;
  experience_match: number;
  keyword_match: number;
  job_freshness: number;
  competition_level: number;
};

export type PredictResponsePayload = {
  response_probability: number;
  confidence_level: ConfidenceBand;
  factors: PredictionFactors;
  insights: string[];
  recommendations: string[];
  methodology_note?: string;
};
