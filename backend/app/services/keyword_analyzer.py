"""Keyword gap analysis."""

from app.schemas.schemas import JobDescriptionAnalysis, KeywordAnalysis
from app.services.nlp_engine import match_keywords
from app.services.ats_scorer import get_keyword_frequency


def analyze_keywords(resume_text: str, jd: JobDescriptionAnalysis) -> KeywordAnalysis:
  found, missing = match_keywords(resume_text, jd.keywords)
  hp_found, hp_missing = match_keywords(resume_text, jd.high_priority_keywords)

  return KeywordAnalysis(
    found_keywords=found,
    missing_keywords=missing,
    high_priority_keywords=hp_found + [k for k in hp_missing if k not in hp_found],
    keyword_frequency=get_keyword_frequency(resume_text, jd.keywords),
  )
