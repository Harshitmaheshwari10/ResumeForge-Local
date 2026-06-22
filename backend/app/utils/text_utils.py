"""Shared text processing helpers."""

import re
from collections import Counter


def normalize_text(text: str) -> str:
  """Collapse whitespace and normalize line endings."""
  text = text.replace("\r\n", "\n").replace("\r", "\n")
  text = re.sub(r"[ \t]+", " ", text)
  text = re.sub(r"\n{3,}", "\n\n", text)
  return text.strip()


def tokenize_words(text: str) -> list[str]:
  """Extract lowercase alphanumeric tokens."""
  return re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]*", text.lower())


def extract_sentences(text: str) -> list[str]:
  """Split text into sentences."""
  parts = re.split(r"(?<=[.!?])\s+", text.strip())
  return [p.strip() for p in parts if p.strip()]


def word_frequency(text: str) -> dict[str, int]:
  tokens = tokenize_words(text)
  return dict(Counter(tokens))


def clean_bullet(text: str) -> str:
  return re.sub(r"^[\s•\-\*●○▪►]+\s*", "", text.strip())


def is_bullet_line(line: str) -> bool:
  return bool(re.match(r"^[\s•\-\*●○▪►]", line.strip()))


def dedupe_preserve_order(items: list[str]) -> list[str]:
  seen: set[str] = set()
  result: list[str] = []
  for item in items:
    key = item.lower().strip()
    if key and key not in seen:
      seen.add(key)
      result.append(item.strip())
  return result


def truncate(text: str, max_len: int = 200) -> str:
  if len(text) <= max_len:
    return text
  return text[: max_len - 3].rstrip() + "..."


def contains_term(text: str, term: str) -> bool:
  """Check if term appears in text with word boundaries (avoids 'r' in 'developer')."""
  if not term or not text:
    return False
  pattern = r"\b" + re.escape(term) + r"\b"
  return bool(re.search(pattern, text, re.IGNORECASE))
