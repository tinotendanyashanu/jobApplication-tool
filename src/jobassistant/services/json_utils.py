from __future__ import annotations

import json
import re


def parse_json_object(raw: str) -> dict:
    """Parse model output that should be JSON; tolerate fences and leading/trailing prose."""
    text = raw.strip()

    # Strip markdown fences
    fence = re.match(r"^```(?:json)?\s*", text, re.IGNORECASE)
    if fence:
        text = text[fence.end():]
        closing = text.rfind("```")
        if closing != -1:
            text = text[:closing]
    text = text.strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fallback: extract between first { and last } to strip any surrounding prose
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass

    return json.loads(text)  # re-raise with original error
