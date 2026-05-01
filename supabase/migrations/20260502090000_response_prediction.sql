-- Phase 5: response prediction snapshots + recruiter feedback primitives

CREATE TYPE public.application_outcome AS ENUM (
  'response',
  'interview',
  'rejected',
  'none'
);

ALTER TABLE public.applications
  ADD COLUMN response_probability SMALLINT
    CHECK (response_probability IS NULL OR (response_probability >= 0 AND response_probability <= 100)),
  ADD COLUMN confidence_level TEXT
    CHECK (confidence_level IS NULL OR confidence_level IN ('low', 'medium', 'high')),
  ADD COLUMN outcome public.application_outcome NULL,
  ADD COLUMN response_time_days INTEGER
    CHECK (response_time_days IS NULL OR response_time_days >= 0);

COMMENT ON COLUMN public.applications.response_probability IS 'Rule-based or future model estimate (0–100).';
COMMENT ON COLUMN public.applications.confidence_level IS 'Data sufficiency bands for prediction inputs.';
COMMENT ON COLUMN public.applications.outcome IS 'User-reported hiring signal for eventual ML labeling.';
COMMENT ON COLUMN public.applications.response_time_days IS 'Days until first recruiter signal (best effort).';
