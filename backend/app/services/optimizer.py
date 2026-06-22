"""Orchestrates full resume optimization pipeline."""

import json

from app.schemas.schemas import OptimizationResult
from app.services.ats_scorer import calculate_ats_scores
from app.services.jd_analyzer import analyze_job_description
from app.services.keyword_analyzer import analyze_keywords
from app.services.resume_parser import parse_resume
from app.services.resume_rewriter import generate_suggestions, rewrite_resume
from app.services.skill_analyzer import analyze_skill_gap


def optimize_resume(
  resume_text: str,
  job_description: str,
  template: str = "generic",
) -> OptimizationResult:
  """Run complete analysis and optimization pipeline."""
  original = parse_resume(resume_text)
  jd = analyze_job_description(job_description)

  original_scores = calculate_ats_scores(original, jd)
  optimized = rewrite_resume(original, jd, template)
  optimized_scores = calculate_ats_scores(optimized, jd)

  keyword_analysis = analyze_keywords(optimized.raw_text, jd)
  skill_gap = analyze_skill_gap(optimized, jd)
  suggestions = generate_suggestions(optimized_scores, keyword_analysis, skill_gap)

  return OptimizationResult(
    original_resume=original,
    optimized_resume=optimized,
    optimized_text=optimized.raw_text,
    job_analysis=jd,
    scores=optimized_scores,
    keyword_analysis=keyword_analysis,
    skill_gap=skill_gap,
    suggestions=suggestions,
    template=template,
  )


def result_to_json(result: OptimizationResult) -> str:
  return json.dumps(result.model_dump(), default=str)
