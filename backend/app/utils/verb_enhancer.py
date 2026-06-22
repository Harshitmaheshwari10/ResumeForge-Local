"""Action verb enhancement for resume bullets."""

import re

WEAK_VERBS: dict[str, str] = {
  "worked on": "developed",
  "worked with": "collaborated on",
  "helped": "supported",
  "helped with": "contributed to",
  "made": "developed",
  "did": "executed",
  "was responsible for": "managed",
  "responsible for": "managed",
  "handled": "managed",
  "used": "utilized",
  "fixed": "resolved",
  "looked at": "analyzed",
  "looked into": "investigated",
  "tried to": "implemented",
  "assisted with": "supported",
  "assisted in": "supported",
  "participated in": "contributed to",
  "involved in": "contributed to",
  "in charge of": "led",
  "dealt with": "addressed",
}

STRONG_VERBS = [
  "achieved", "analyzed", "architected", "automated", "built", "collaborated",
  "configured", "created", "delivered", "designed", "developed", "engineered",
  "enhanced", "executed", "implemented", "improved", "increased", "integrated",
  "launched", "led", "maintained", "managed", "optimized", "orchestrated",
  "produced", "reduced", "refactored", "resolved", "streamlined", "utilized",
]


def enhance_verbs(text: str) -> str:
  """Replace weak phrasing with stronger professional verbs."""
  result = text
  for weak, strong in sorted(WEAK_VERBS.items(), key=lambda x: -len(x[0])):
    pattern = re.compile(re.escape(weak), re.IGNORECASE)
    result = pattern.sub(strong.capitalize() if result.startswith(weak[:1].upper()) else strong, result, count=1)

  # Capitalize first word if it starts a bullet
  result = result.strip()
  if result and result[0].islower():
    result = result[0].upper() + result[1:]
  return result


def starts_with_verb(text: str) -> bool:
  first_word = text.split()[0].lower().rstrip(".,;:") if text.split() else ""
  return first_word in STRONG_VERBS or first_word.endswith("ed")


def ensure_action_verb_start(text: str) -> str:
  """Prefix with a neutral action verb if bullet doesn't start with one."""
  if not text or starts_with_verb(text):
    return text
  return f"Developed {text[0].lower() + text[1:]}" if text else text
