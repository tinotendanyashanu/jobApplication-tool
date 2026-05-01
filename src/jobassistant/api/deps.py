from functools import lru_cache

from jobassistant.config import Settings, get_settings
from jobassistant.services.llm import OpenAIClient


@lru_cache
def llm_client() -> OpenAIClient:
    settings = get_settings()
    return OpenAIClient(settings)


def settings_dep() -> Settings:
    return get_settings()
