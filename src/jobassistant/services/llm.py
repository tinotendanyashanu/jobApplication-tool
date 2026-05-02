from __future__ import annotations

from typing import Protocol, runtime_checkable

from openai import OpenAI

from jobassistant.config import Settings, google_ai_enabled


@runtime_checkable
class LLMClient(Protocol):
    def complete(self, *, system: str, user: str, model: str) -> str: ...


class OpenAIClient:
    """Thin synchronous wrapper around Chat Completions (OpenAI SDK 2.x)."""

    def __init__(self, settings: Settings) -> None:
        kwargs: dict = {}
        if google_ai_enabled(settings):
            kwargs["api_key"] = settings.google_ai_api_key
            kwargs["base_url"] = settings.google_ai_base_url.strip()
        elif settings.openai_api_key:
            kwargs["api_key"] = settings.openai_api_key
            if settings.openai_base_url:
                kwargs["base_url"] = settings.openai_base_url
        self._client = OpenAI(**kwargs)

    def complete(
        self,
        *,
        system: str,
        user: str,
        model: str,
        temperature: float = 0.35,
        max_tokens: int = 4096,
        response_format: dict | None = None,
        extra_body: dict | None = None,
    ) -> str:
        kwargs: dict = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format is not None:
            kwargs["response_format"] = response_format
        if extra_body is not None:
            kwargs["extra_body"] = extra_body
        response = self._client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        content = choice.message.content
        return (content or "").strip()

    def complete_json(
        self,
        *,
        system: str,
        user: str,
        model: str,
        temperature: float = 0.25,
        max_tokens: int = 4096,
    ) -> str:
        """Chat completion constrained to JSON for structured pipelines."""

        return self.complete(
            system=system,
            user=user,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
