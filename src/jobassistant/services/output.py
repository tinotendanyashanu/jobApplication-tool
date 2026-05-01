from __future__ import annotations

from pathlib import Path


def write_text_outputs(
    directory: Path,
    *,
    cv_text: str,
    cover_letter_text: str,
) -> tuple[Path, Path]:
    directory.mkdir(parents=True, exist_ok=True)
    cv_path = directory / "cv.txt"
    letter_path = directory / "cover_letter.txt"
    cv_path.write_text(cv_text.strip() + "\n", encoding="utf-8")
    letter_path.write_text(cover_letter_text.strip() + "\n", encoding="utf-8")
    return cv_path, letter_path
