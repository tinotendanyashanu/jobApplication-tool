from __future__ import annotations

"""Document generation orchestration with Phase 3 intelligence chaining."""

from jobassistant.config import Settings, default_llm_model
from jobassistant.schemas.generation import (
    GenerateMeta,
    GenerateRequest,
    GenerateResponse,
)
from jobassistant.schemas.intelligence import JobAnalysis, ProfileMatchResponse
from jobassistant.services.intelligence.job_analysis import run_job_analysis
from jobassistant.services.intelligence.matching import run_profile_match
from jobassistant.services.llm import LLMClient, OpenAIClient
from jobassistant.services.prompt_loader import SHARED_SYSTEM_PROMPT, render_user_prompt


def resolve_model(request: GenerateRequest, settings: Settings) -> str:
    return request.model or default_llm_model(settings)


def effective_job_description(request: GenerateRequest) -> str:
    jd = request.job_description.strip()
    link = (request.job_link or "").strip()
    if link:
        return f"{jd}\n\n(Job posting URL, for traceability — do not invent details not in the pasted text above: {link})"
    return jd


def prepare_intelligence(
    llm: OpenAIClient,
    request: GenerateRequest,
    settings: Settings,
) -> tuple[JobAnalysis, ProfileMatchResponse | None]:
    """Reuse supplied intel or derive it synchronously."""

    model = resolve_model(request, settings)
    if request.job_analysis is not None:
        analysis = request.job_analysis
    else:
        jd = effective_job_description(request)
        analysis = run_job_analysis(
            llm=llm,
            job_description=jd,
            model=model,
        )

    if request.match_result is not None:
        match = request.match_result
    elif request.include_match_in_prompts:
        match = run_profile_match(
            llm=llm,
            profile=request.profile,
            analysis=analysis,
            model=model,
        )
    else:
        match = None

    return analysis, match


def generate_cv(
    llm: LLMClient,
    request: GenerateRequest,
    settings: Settings,
    *,
    job_analysis: JobAnalysis,
    match_result: ProfileMatchResponse | None,
) -> str:
    jd = effective_job_description(request)
    user_prompt = render_user_prompt(
        "cv.md",
        profile=request.profile,
        job_description=jd,
        locale=request.locale,
        job_analysis=job_analysis,
        match_result=match_result,
        cv_knowledge_base=request.cv_knowledge_base,
        cv_style_templates=request.cv_style_templates,
    )
    return llm.complete(
        system=SHARED_SYSTEM_PROMPT,
        user=user_prompt,
        model=resolve_model(request, settings),
    )


def generate_cover_letter(
    llm: LLMClient,
    request: GenerateRequest,
    settings: Settings,
    *,
    job_analysis: JobAnalysis,
    match_result: ProfileMatchResponse | None,
) -> str:
    jd = effective_job_description(request)
    user_prompt = render_user_prompt(
        "cover_letter.md",
        profile=request.profile,
        job_description=jd,
        locale=request.locale,
        job_analysis=job_analysis,
        match_result=match_result,
        cv_knowledge_base=request.cv_knowledge_base,
        cv_style_templates=request.cv_style_templates,
    )
    return llm.complete(
        system=SHARED_SYSTEM_PROMPT,
        user=user_prompt,
        model=resolve_model(request, settings),
    )


def generate_application_pack(
    llm: OpenAIClient,
    request: GenerateRequest,
    settings: Settings,
) -> GenerateResponse:
    analysis, match = prepare_intelligence(llm, request, settings)
    cv_text = generate_cv(
        llm,
        request,
        settings,
        job_analysis=analysis,
        match_result=match,
    )
    cover_text = generate_cover_letter(
        llm,
        request,
        settings,
        job_analysis=analysis,
        match_result=match,
    )
    model = resolve_model(request, settings)
    return GenerateResponse(
        cv_text=cv_text,
        cover_letter_text=cover_text,
        meta=GenerateMeta(
            model=model,
            locale=request.locale,
            job_analysis=analysis,
            match_result=match,
        ),
    )
