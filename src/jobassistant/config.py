from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    #: Google Gemini via OpenAI-compatible Chat Completions (preferred when set).
    google_ai_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("GOOGLE_AI_API_KEY", "google_ai_api_key"),
    )
    google_ai_model: str = Field(
        default="gemini-2.5-flash-lite",
        validation_alias=AliasChoices(
            "GOOGLE_AI_MODEL",
            "GEMINI_MODEL",
            "google_ai_model",
        ),
    )
    #: OpenAI (or other OpenAI-compatible servers) — used when `GOOGLE_AI_API_KEY` is unset.
    openai_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("OPENAI_API_KEY", "openai_api_key"),
    )
    openai_model: str = Field(
        default="gpt-4o-mini",
        validation_alias=AliasChoices("OPENAI_MODEL", "openai_model"),
    )
    openai_base_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("OPENAI_BASE_URL", "openai_base_url"),
    )

    #: Base URL for Gemini's OpenAI-compatible Chat Completions.
    google_ai_base_url: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta/openai/",
        validation_alias=AliasChoices(
            "GOOGLE_AI_BASE_URL",
            "google_ai_base_url",
        ),
    )

    #: Supabase / Postgres pool DSN (e.g. pooled URI from dashboard). Omit to disable /applications APIs.
    database_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "DATABASE_URL",
            "SUPABASE_DATABASE_URL",
            "database_url",
        ),
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


def google_ai_enabled(settings: Settings) -> bool:
    return bool(settings.google_ai_api_key and settings.google_ai_api_key.strip())


def llm_credentials_configured(settings: Settings) -> bool:
    """True when at least one provider has an API key."""
    if google_ai_enabled(settings):
        return True
    return bool(settings.openai_api_key and settings.openai_api_key.strip())


def default_llm_model(settings: Settings) -> str:
    """Model id for the effective provider."""
    return settings.google_ai_model if google_ai_enabled(settings) else settings.openai_model
