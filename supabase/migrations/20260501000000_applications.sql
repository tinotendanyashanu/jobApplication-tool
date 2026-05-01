-- Phase 4: application tracking (Supabase PostgreSQL)
-- Apply via Supabase SQL editor or `supabase db push`.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.application_status AS ENUM (
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected',
  'no_response'
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_description TEXT NOT NULL,
  match_score INTEGER NULL CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),
  skill_match INTEGER NULL CHECK (skill_match IS NULL OR (skill_match >= 0 AND skill_match <= 100)),
  experience_match INTEGER NULL CHECK (experience_match IS NULL OR (experience_match >= 0 AND experience_match <= 100)),
  keyword_match INTEGER NULL CHECK (keyword_match IS NULL OR (keyword_match >= 0 AND keyword_match <= 100)),
  strengths TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  gaps TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  cv_text TEXT NOT NULL DEFAULT '',
  cover_letter_text TEXT NOT NULL DEFAULT '',
  status public.application_status NOT NULL DEFAULT 'saved',
  applied_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX applications_user_created_idx
  ON public.applications (user_id, created_at DESC);

CREATE INDEX applications_user_status_idx
  ON public.applications (user_id, status);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_set_updated_at ON public.applications;
CREATE TRIGGER applications_set_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Adjust policies when wiring Supabase Auth (auth.uid()).
-- MVP: backend uses service_role connection string and filters by user_id in SQL.

COMMENT ON TABLE public.applications IS 'Job application tracker: documents, scores, status.';
