from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from pydantic import ValidationError

from jobassistant.config import get_settings, llm_credentials_configured
from jobassistant.schemas.generation import GenerateRequest, Locale
from jobassistant.schemas.profile import UserProfile
from jobassistant.services.generation import generate_application_pack
from jobassistant.services.llm import OpenAIClient
from jobassistant.services.output import write_text_outputs


def _parse_locale(value: str) -> Locale:
    v = value.lower().strip()
    if v not in ("en", "pl"):
        raise argparse.ArgumentTypeError("locale must be 'en' or 'pl'")
    return v  # type: ignore[return-value]


def _load_profile(path: Path) -> UserProfile:
    data = json.loads(path.read_text(encoding="utf-8"))
    return UserProfile.model_validate(data)


def _load_job_text(job_file: Path | None, job_inline: str | None) -> str:
    if job_file:
        return job_file.read_text(encoding="utf-8").strip()
    if job_inline is not None and job_inline.strip():
        return job_inline.strip()
    raise ValueError("Provide --job-file or --job-text.")


def _cmd_generate(args: argparse.Namespace) -> int:
    settings = get_settings()
    if not llm_credentials_configured(settings):
        print(
            "Missing LLM credentials. Copy .env.example to .env and set GOOGLE_AI_API_KEY "
            "(Gemini) and/or OPENAI_API_KEY.",
            file=sys.stderr,
        )
        return 1

    if not args.out and not args.stdout:
        print("Provide --out and/or --stdout.", file=sys.stderr)
        return 1

    try:
        profile = _load_profile(Path(args.profile))
        job_description = _load_job_text(args.job_file, args.job_text)
        request = GenerateRequest(
            profile=profile,
            job_description=job_description,
            locale=args.locale,
            model=args.model,
        )
    except (OSError, json.JSONDecodeError, ValidationError, ValueError) as exc:
        print(exc, file=sys.stderr)
        return 1

    client = OpenAIClient(settings)

    try:
        result = generate_application_pack(client, request, settings)
    except Exception as exc:  # noqa: BLE001 — surface API errors cleanly for CLI users
        print(f"Generation failed: {exc}", file=sys.stderr)
        return 1

    if args.stdout:
        print("=== CV ===\n")
        print(result.cv_text.strip())
        print("\n=== COVER LETTER ===\n")
        print(result.cover_letter_text.strip())

    if args.out:
        out_dir = Path(args.out)
        cv_path, letter_path = write_text_outputs(
            out_dir,
            cv_text=result.cv_text,
            cover_letter_text=result.cover_letter_text,
        )
        print(f"Wrote CV: {cv_path}", file=sys.stderr)
        print(f"Wrote cover letter: {letter_path}", file=sys.stderr)

    return 0


def _cmd_serve(args: argparse.Namespace) -> int:
    import uvicorn

    uvicorn.run(
        "jobassistant.api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI job-application assistant — Phase 1 MVP")
    sub = parser.add_subparsers(dest="command", required=True)

    gen = sub.add_parser("generate", help="Generate tailored CV and cover letter")
    gen.add_argument("--profile", required=True, help="Path to profile JSON")
    fg = gen.add_mutually_exclusive_group(required=True)
    fg.add_argument("--job-file", type=Path, help="Path to job description text file")
    fg.add_argument("--job-text", help="Job description as inline string")
    gen.add_argument(
        "--out",
        help="Directory to write cv.txt and cover_letter.txt (created if missing)",
    )
    gen.add_argument(
        "--stdout",
        action="store_true",
        help="Also print CV and letter to stdout (or only stdout if --out omitted)",
    )
    gen.add_argument("--locale", type=_parse_locale, default="en")
    gen.add_argument("--model", default=None, help="OpenAI model id override")
    gen.set_defaults(func=_cmd_generate)

    srv = sub.add_parser("serve", help="Run the FastAPI app with uvicorn")
    srv.add_argument("--host", default="127.0.0.1")
    srv.add_argument("--port", type=int, default=8000)
    srv.add_argument("--reload", action="store_true")
    srv.set_defaults(func=_cmd_serve)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    code = args.func(args)
    raise SystemExit(code)


if __name__ == "__main__":
    main()
