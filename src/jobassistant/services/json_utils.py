from __future__ import annotations

import json
import re


def parse_json_object(raw: str) -> dict:
    """Parse model output that should be JSON; tolerate occasional code fences."""
    text = raw.strip()
    fence = re.match(r"^```(?:json)?\s*", text, re.IGNORECASE)
    if fence:
        text = text[fence.end() :]
        closing = text.rfind("```")
        if closing != -1:
            text = text[:closing]
    return json.loads(text.strip())
