"""ATS scoring engine — computes compatibility scores locally."""

import re

from app.schemas.schemas import JobDescriptionAnalysis, ParsedResume, ScoreBreakdown
from app.services.nlp_engine import compute_similarity, match_keywords
from app.utils.text_utils import word_frequency, contains_term


def _score_keyword_match(resume_text: str, jd: JobDescriptionAnalysis) -> float:
  if not jd.keywords:
    return 50.0
  found, missing = match_keywords(resume_text, jd.keywords)
  ratio = len(found) / len(jd.keywords)
  # Weight high-priority keywords more
  if jd.high_priority_keywords:
    hp_found, _ = match_keywords(resume_text, jd.high_priority_keywords)
    hp_ratio = len(hp_found) / len(jd.high_priority_keywords)
    return min(100.0, (ratio * 0.6 + hp_ratio * 0.4) * 100)
  return min(100.0, ratio * 100)


def _score_skill_match(resume: ParsedResume, jd: JobDescriptionAnalysis) -> float:
  resume_skills = {s.lower() for s in resume.sections.skills}
  resume_text_lower = resume.raw_text.lower()
  jd_skills = [s.lower() for s in jd.technical_skills + jd.soft_skills]
  if not jd_skills:
    return 60.0

  matched = 0
  for skill in jd_skills:
    if skill in resume_skills or contains_term(resume_text_lower, skill):
      matched += 1
  return min(100.0, (matched / len(jd_skills)) * 100)


def _score_experience_match(resume: ParsedResume, jd: JobDescriptionAnalysis) -> float:
  exp_text = " ".join(
    " ".join(e.get("bullets", [])) + " " + e.get("title", "")
    for e in resume.sections.experience
  )
  if not exp_text.strip():
    return 30.0

  sim = compute_similarity(exp_text, jd.raw_text)
  # Years of experience heuristic
  years_in_jd = re.findall(r"(\d+)\+?\s*years?", jd.raw_text.lower())
  years_in_resume = re.findall(r"(\d+)\+?\s*years?", resume.raw_text.lower())
  year_bonus = 0.0
  if years_in_jd and years_in_resume:
    req_years = max(int(y) for y in years_in_jd)
    res_years = max(int(y) for y in years_in_resume)
    if res_years >= req_years:
      year_bonus = 0.15
    elif res_years >= req_years * 0.7:
      year_bonus = 0.08

  return min(100.0, (sim + year_bonus) * 100)


def _score_education_match(resume: ParsedResume, jd: JobDescriptionAnalysis) -> float:
  edu_text = " ".join(
    e.get("institution", "") + " " + e.get("degree", "")
    for e in resume.sections.education
  )
  if not edu_text.strip():
    return 40.0

  jd_lower = jd.raw_text.lower()
  degrees = ["bachelor", "master", "phd", "doctorate", "associate", "mba", "b.s.", "m.s.", "b.a.", "m.a."]
  required_degrees = [d for d in degrees if d in jd_lower]
  if not required_degrees:
    return 75.0

  edu_lower = edu_text.lower()
  matched = sum(1 for d in required_degrees if d in edu_lower)
  return min(100.0, (matched / len(required_degrees)) * 100) if matched else 45.0


def _score_formatting(resume: ParsedResume) -> float:
  """ATS-friendly formatting checks."""
  text = resume.raw_text
  score = 100.0

  # Penalize tables (pipe-heavy lines)
  pipe_lines = sum(1 for line in text.split("\n") if line.count("|") >= 3)
  score -= min(20, pipe_lines * 5)

  # Penalize very long lines (likely multi-column)
  long_lines = sum(1 for line in text.split("\n") if len(line) > 120)
  score -= min(15, long_lines * 3)

  # Reward clear section headers
  section_headers = sum(
    1 for line in text.split("\n")
    if line.strip() and line.strip().isupper() and len(line.strip()) < 40
  )
  score += min(10, section_headers * 2)

  # Reward bullet points
  bullets = sum(1 for line in text.split("\n") if re.match(r"^[\s•\-\*]", line))
  score += min(10, bullets)

  # Penalize images/graphics indicators
  if re.search(r"\[image\]|<img|\.png|\.jpg|\.svg", text, re.IGNORECASE):
    score -= 15

  # Word count sanity
  wc = resume.word_count
  if wc < 200:
    score -= 10
  elif wc > 1200:
    score -= 5

  return max(0.0, min(100.0, score))


def calculate_ats_scores(resume: ParsedResume, jd: JobDescriptionAnalysis) -> ScoreBreakdown:
  """Compute full ATS score breakdown."""
  keyword = _score_keyword_match(resume.raw_text, jd)
  skill = _score_skill_match(resume, jd)
  experience = _score_experience_match(resume, jd)
  education = _score_education_match(resume, jd)
  formatting = _score_formatting(resume)

  overall = (
    keyword * 0.30
    + skill * 0.25
    + experience * 0.25
    + education * 0.10
    + formatting * 0.10
  )

  return ScoreBreakdown(
    keyword_match=round(keyword, 1),
    skill_match=round(skill, 1),
    experience_match=round(experience, 1),
    education_match=round(education, 1),
    formatting=round(formatting, 1),
    overall=round(overall, 1),
  )


def get_keyword_frequency(resume_text: str, keywords: list[str]) -> dict[str, int]:
  freq = word_frequency(resume_text)
  return {kw: freq.get(kw.lower(), 0) for kw in keywords}
