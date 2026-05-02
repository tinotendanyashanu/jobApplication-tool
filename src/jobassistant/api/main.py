from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from jobassistant.api.deps import llm_client, settings_dep
from jobassistant.config import Settings, default_llm_model, get_settings, llm_credentials_configured
from jobassistant.schemas.generation import (
    GenerateRequest,
    GenerateResponse,
    GenerateMeta,
    SingleGenerateResponse,
)
from jobassistant.schemas.intelligence import (
    AnalyzeJobRequest,
    AnalyzeJobResponse,
    MatchProfileRequest,
    ProfileMatchResponse,
)
from jobassistant.services.generation import (
    generate_application_pack,
    generate_cover_letter,
    generate_cv,
    prepare_intelligence,
    resolve_model,
)
from jobassistant.services.intelligence.job_analysis import run_job_analysis
from jobassistant.services.intelligence.matching import run_profile_match
from jobassistant.services.llm import OpenAIClient
from jobassistant.services.output import write_text_outputs
from jobassistant.db.pool import close_pool, init_pool
from jobassistant.api.applications_router import router as applications_router
from jobassistant.api.prediction_router import router as prediction_router
from jobassistant.api.scraper_router import router as scraper_router
from jobassistant.api.autofill_router import router as autofill_router
from jobassistant.api.files_router import router as files_router


@asynccontextmanager
async def _lifespan(_app: FastAPI):
    cfg = get_settings()
    if cfg.database_url:
        init_pool(cfg.database_url)
    yield
    close_pool()


app = FastAPI(
    title="Job Assistant API",
    version="0.5.0",
    description="Tailored hiring docs, job intelligence, application tracking, and response prediction.",
    lifespan=_lifespan,
)

# Browsers send OPTIONS preflight when custom headers are used (e.g. GET + X-User-Id). If Origin is not
# in allow_origins, Starlette replies 400 Bad Request ("Disallowed CORS origin"). Next/Vercel rewrites
# forward that Origin to the API. Default allow all origins; set CORS_ORIGINS to a comma list to lock
# down. allow_credentials=False allows wildcard origins; API auth is X-User-Id, not cookies.
_origins_env = (os.getenv("CORS_ORIGINS") or "").strip()
_allow_origins: list[str] = (
    [o.strip() for o in _origins_env.split(",") if o.strip()] if _origins_env else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(applications_router)
app.include_router(prediction_router)
app.include_router(scraper_router)
app.include_router(autofill_router)
app.include_router(files_router)


@app.post("/analyze-job", response_model=AnalyzeJobResponse)
async def analyze_job_route(
    body: AnalyzeJobRequest,
    client: OpenAIClient = Depends(llm_client),
    settings: Settings = Depends(settings_dep),
) -> AnalyzeJobResponse:
    _require_api_key(settings)

    model = body.model or default_llm_model(settings)

    def _run() -> AnalyzeJobResponse:
        analysis = run_job_analysis(
            llm=client,
            job_description=body.job_description.strip(),
            model=model,
        )
        return AnalyzeJobResponse(analysis=analysis, model_name=model)

    return await asyncio.to_thread(_run)


@app.post("/match-profile", response_model=ProfileMatchResponse)
async def match_profile_route(
    body: MatchProfileRequest,
    client: OpenAIClient = Depends(llm_client),
    settings: Settings = Depends(settings_dep),
) -> ProfileMatchResponse:
    _require_api_key(settings)
    model = body.model or default_llm_model(settings)

    def _run() -> ProfileMatchResponse:
        return run_profile_match(
            llm=client,
            profile=body.profile,
            analysis=body.job_analysis,
            model=model,
        )

    return await asyncio.to_thread(_run)


@app.post("/v1/generate", response_model=GenerateResponse)
async def generate_documents(
    body: GenerateRequest,
    *,
    persist: bool = False,
    output_dir: str | None = None,
    client: OpenAIClient = Depends(llm_client),
    settings: Settings = Depends(settings_dep),
) -> GenerateResponse:
    _require_api_key(settings)
    return await _persist_wrapper(
        body,
        client,
        settings,
        persist=persist,
        output_dir=output_dir,
    )


@app.post("/generate-cv", response_model=SingleGenerateResponse)
async def generate_cv_route(
    body: GenerateRequest,
    client: OpenAIClient = Depends(llm_client),
    settings: Settings = Depends(settings_dep),
) -> SingleGenerateResponse:
    _require_api_key(settings)

    def _run() -> SingleGenerateResponse:
        analysis, match = prepare_intelligence(client, body, settings)
        text = generate_cv(
            client,
            body,
            settings,
            job_analysis=analysis,
            match_result=match,
        )
        meta = GenerateMeta(
            model=resolve_model(body, settings),
            locale=body.locale,
            job_analysis=analysis,
            match_result=match,
        )
        return SingleGenerateResponse(text=text, meta=meta)

    return await asyncio.to_thread(_run)


@app.post("/generate-cover-letter", response_model=SingleGenerateResponse)
async def generate_cover_letter_route(
    body: GenerateRequest,
    client: OpenAIClient = Depends(llm_client),
    settings: Settings = Depends(settings_dep),
) -> SingleGenerateResponse:
    _require_api_key(settings)

    def _run() -> SingleGenerateResponse:
        analysis, match = prepare_intelligence(client, body, settings)
        text = generate_cover_letter(
            client,
            body,
            settings,
            job_analysis=analysis,
            match_result=match,
        )
        meta = GenerateMeta(
            model=resolve_model(body, settings),
            locale=body.locale,
            job_analysis=analysis,
            match_result=match,
        )
        return SingleGenerateResponse(text=text, meta=meta)

    return await asyncio.to_thread(_run)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def _require_api_key(settings: Settings) -> None:
    if not llm_credentials_configured(settings):
        raise HTTPException(
            status_code=500,
            detail="No LLM API key configured — set GOOGLE_AI_API_KEY (Gemini) or OPENAI_API_KEY on the server.",
        )


async def _persist_wrapper(
    body: GenerateRequest,
    client: OpenAIClient,
    settings: Settings,
    *,
    persist: bool,
    output_dir: str | None,
) -> GenerateResponse:
    def _run() -> GenerateResponse:
        return generate_application_pack(client, body, settings)

    result = await asyncio.to_thread(_run)

    if persist:
        if not output_dir:
            raise HTTPException(
                status_code=400,
                detail="When persist=true, output_dir query parameter is required.",
            )
        await asyncio.to_thread(
            write_text_outputs,
            Path(output_dir),
            cv_text=result.cv_text,
            cover_letter_text=result.cover_letter_text,
        )

    return result
