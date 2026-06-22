"""Job description analyzer."""

import re

from app.schemas.schemas import JobDescriptionAnalysis
from app.services.nlp_engine import extract_keywords_tfidf, extract_skills_from_text
from app.utils.text_utils import dedupe_preserve_order, extract_sentences, normalize_text


def _extract_list_items(text: str, headers: list[str]) -> list[str]:
  items: list[str] = []
  pattern = "|".join(re.escape(h) for h in headers)
  sections = re.split(rf"(?i)(?:{pattern})\s*:?\s*\n", text)
  for section in sections[1:]:
    for line in section.split("\n"):
      line = line.strip()
      if re.match(r"^[\s•\-\*]", line):
        items.append(re.sub(r"^[\s•\-\*]+\s*", "", line))
      elif line and len(line) > 15 and not re.match(r"^[A-Z\s]{3,}$", line):
        if len(items) < 20:
          items.append(line)
    break
  return items[:15]


def analyze_job_description(text: str) -> JobDescriptionAnalysis:
  """Extract skills, requirements, and keywords from a job description."""
  text = normalize_text(text)
  technical, soft = extract_skills_from_text(text)

  responsibilities = _extract_list_items(
    text,
    ["responsibilities", "duties", "what you will do", "what you'll do", "role"],
  )
  requirements = _extract_list_items(
    text,
    ["requirements", "qualifications", "must have", "required", "minimum qualifications"],
  )

  if not responsibilities:
    responsibilities = [
      s for s in extract_sentences(text)
      if any(w in s.lower() for w in ("responsible", "develop", "manage", "lead", "design", "implement"))
    ][:8]

  if not requirements:
    requirements = [
      s for s in extract_sentences(text)
      if any(w in s.lower() for w in ("required", "must", "minimum", "years", "degree", "experience"))
    ][:8]

  keywords = extract_keywords_tfidf([text], top_n=40)
  # High priority = appears in requirements + technical skills
  req_text = " ".join(requirements).lower()
  high_priority = dedupe_preserve_order([
    kw for kw in keywords
    if kw.lower() in req_text or kw.lower() in " ".join(technical).lower()
  ][:20])

  # Supplement keywords with extracted skills
  all_keywords = dedupe_preserve_order(keywords + technical + soft)

  return JobDescriptionAnalysis(
    raw_text=text,
    technical_skills=technical,
    soft_skills=soft,
    responsibilities=responsibilities,
    requirements=requirements,
    keywords=all_keywords,
    high_priority_keywords=high_priority or all_keywords[:15],
  )
