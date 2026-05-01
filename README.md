# Job Assistant

Local CLI, HTTP API, and a **Next.js Phase 2 workspace** that turns a structured profile plus job context into tailored plain-text CV and cover letter drafts via the OpenAI API.

## Requirements

- Python 3.10+
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Setup

```bash
cd /path/to/jobhunt
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
```

## CLI

Commands are available as `jobassistant` after installation, or via `python -m jobassistant.cli.main`.

Generate files under an output directory (created if missing):

```bash
jobassistant generate \
  --profile examples/profile.example.json \
  --job-file examples/job.example.txt \
  --out outputs/run-001
```

Print results to the terminal instead of (or in addition to) files:

```bash
jobassistant generate \
  --profile examples/profile.example.json \
  --job-file examples/job.example.txt \
  --stdout
```

Polish output language:

```bash
jobassistant generate \
  --profile examples/profile.example.json \
  --job-file examples/job.example.txt \
  --locale pl \
  --out outputs/pl-run
```

Override the model for one run:

```bash
jobassistant generate --profile examples/profile.example.json \
  --job-file examples/job.example.txt \
  --model gpt-4o \
  --out outputs/run-002
```

## Intelligence layer (Phase 3)

The backend now derives structured JD intel, optional match narratives, and injects both into CV/cover-letter prompts.

| Endpoint | Body | Response |
| --- | --- | --- |
| `POST /analyze-job` | `{ "job_description": "...", "model": null }` | `{ "analysis": JobAnalysis, "model_name": "..." }` |
| `POST /match-profile` | `{ "profile": {...}, "job_analysis": {...}, "model": null }` | `ProfileMatchResponse` (deterministic scores + grounded lists) |

`GenerateRequest` additions (all optional except when you want to skip work):

| Field | Purpose |
| --- | --- |
| `job_analysis` | When set, skips the automatic `/analyze-job` pass. |
| `match_result` | When set, skips `/match-profile` and still feeds prompts. |
| `include_match_in_prompts` | When `true`, the server runs `/match-profile` internally before drafting (extra LLM call + cost). Default `false`—only JD analysis is always applied. |

When the UI (or CLI) calls `/generate-cv` **and** `/generate-cover-letter` separately, each request re-runs intelligence unless you echo back the `job_analysis` (and optionally `match_result`) from the first response—see example JSON files in `examples/`.

Example shapes: [`examples/job_analysis.example.json`](examples/job_analysis.example.json), [`examples/profile_match.example.json`](examples/profile_match.example.json).

### Accuracy tips

- Paste more complete JD text—short blurbs yield empty `required_skills` and conservative scores (~40s).
- Reuse cached `job_analysis` JSON between CV and letter calls to save tokens and keep prompts consistent.
- Turn on `include_match_in_prompts` when you want candid strengths/gaps embedded in drafts; keep it off for faster/cheaper iterations.
- Edit `src/jobassistant/prompts/job_analysis.md` / `match_narrative.md` to tighten extraction or tone without touching Python.

## Web UI (Phase 2)

Run the API (see below), then in another terminal:

```bash
cd web
cp .env.example .env.local   # defaults to http://127.0.0.1:8000
npm install                  # first time only
npm run dev
```

Open [http://localhost:3000](http://localhost:3000): landing → **Start** routes to `/workspace` (inputs left, previews right).

The SPA calls **`POST /generate-cv`** and **`POST /generate-cover-letter`** on the backend. Responses match `SingleGenerateResponse` (`text`, `meta`).

## HTTP API

Start the server (after `pip install -e .`):

```bash
jobassistant serve --reload
```

Or run uvicorn directly:

```bash
uvicorn jobassistant.api.main:app --reload
```

### Single endpoints (used by the web UI)

```http
POST /generate-cv
POST /generate-cover-letter
Content-Type: application/json

{
  "profile": { ... },
  "job_description": "...",
  "job_link": "https://...",   // optional, appended as traceability metadata
  "job_analysis": null,        // optional — skip auto extraction when provided
  "match_result": null,        // optional — supply prior /match-profile output
  "include_match_in_prompts": false,
  "locale": "en",
  "model": null
}
```

Responses:

```json
{
  "text": "...",
  "meta": {
    "model": "gpt-4o-mini",
    "locale": "en",
    "job_analysis": { "...": "..." },
    "match_result": null
  }
}
```

### Combined endpoint (`/v1/generate`)

```http
POST /v1/generate
Content-Type: application/json

{
  "profile": { ... },
  "job_description": "Paste job text here...",
  "job_link": null,
  "job_analysis": null,
  "match_result": null,
  "include_match_in_prompts": false,
  "locale": "en",
  "model": null
}
```

Optional query: `persist=true&output_dir=outputs/api-001` to write `cv.txt` and `cover_letter.txt` under that directory.

CORS defaults allow `localhost:3000` and `127.0.0.1:3000`. Override via `CORS_ORIGINS=http://localhost:5173,...` when needed.

## Project layout

- `src/jobassistant/schemas/` — Pydantic models for profile and API/CLI payloads
- `src/jobassistant/schemas/intelligence.py` — `JobAnalysis`, `ProfileMatchResponse`, request/response DTOs
- `src/jobassistant/prompts/` — Editable prompt templates (incl. `job_analysis.md`, `match_narrative.md`)
- `src/jobassistant/services/` — LLM client, generation, file output
- `src/jobassistant/services/intelligence/` — Extraction (`job_analysis.py`), deterministic scoring (`scoring.py`), match orchestration (`matching.py`)
- `web/` — Next.js UI (Tailwind + shadcn components, client-side `.txt`/PDF exporters)
- `examples/` — Sample profile JSON, job text, and Phase 3 sample payloads

## Environment variables

| Variable | Meaning |
| --- | --- |
| `OPENAI_API_KEY` | API key (required for real calls) |
| `OPENAI_MODEL` | Default model id (default: `gpt-4o-mini`) |
| `OPENAI_BASE_URL` | Optional non-default API base URL |
| `CORS_ORIGINS` | Optional comma-separated list for Phase 2 browser clients |

### Frontend env (`web/.env.local`)

| Variable | Meaning |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI server (defaults to `http://127.0.0.1:8000` in code when unset) |

## Note

This tool does not verify facts. Review all generated text before applying; do not submit fabricated experience.
