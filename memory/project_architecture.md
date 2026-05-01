---
name: Project Architecture
description: Full stack architecture of the AI job application assistant — backend modules, frontend pages, data flow
type: project
---

AI-powered job application assistant. FastAPI backend + Next.js frontend.

**Why:** User wants to reduce manual job application effort to a semi-automated workflow.

**How to apply:** Always check existing schemas/services before creating new ones. Backend is in `src/jobassistant/`, frontend in `web/src/`.

## Backend (Python/FastAPI)

- `src/jobassistant/api/main.py` — FastAPI app, all routers registered here
- `src/jobassistant/services/llm.py` — OpenAI-compatible LLM client (Gemini or OpenAI)
- `src/jobassistant/services/generation.py` — CV + cover letter generation orchestration
- `src/jobassistant/services/intelligence/` — job_analysis.py, matching.py, scoring.py, response_prediction.py
- `src/jobassistant/services/scraper/` — http_scraper.py (httpx+BS4), llm_extractor.py, orchestrator.py
- `src/jobassistant/services/autofill.py` — maps UserProfile → ATS form fields
- `src/jobassistant/schemas/` — profile.py, intelligence.py, generation.py, application.py, scrape.py, autofill.py
- `src/jobassistant/db/` — Postgres via psycopg pool, applications_repo.py
- `src/jobassistant/prompts/` — cv.md, cover_letter.md, job_analysis.md, match_narrative.md

## API Endpoints

- `POST /scrape-job` — scrapes job URL → extracted description (LLM-cleaned)
- `POST /analyze-job` — LLM job analysis → JobAnalysis
- `POST /match-profile` — profile vs job → scores + strengths/gaps
- `POST /generate-cv` — tailored CV text
- `POST /generate-cover-letter` — tailored cover letter text
- `POST /v1/generate` — full application pack
- `POST /autofill-fields` — profile → ATS field map (no LLM, pure logic)
- `GET/POST /applications` — CRUD for tracking table (requires DATABASE_URL)
- `POST /predict-response` — response probability estimate

## Frontend (Next.js)

- `/workspace` — main workspace: ProfileForm + JobInput (with Scrape button) + ActionButtons + OutputTabs + AutofillPanel + SaveToTracker
- `/dashboard` — application tracker table/cards with status management

## Key constraints

- LLM: uses Google AI (Gemini) or OpenAI via OpenAI-compatible SDK
- DB: Postgres (Supabase) for application tracking; optional (endpoints 503 without it)
- No auto-submit: user always confirms before any form submission
- Scraper: httpx → BS4 HTML extraction → LLM cleanup; JS-rendered sites may return thin content
