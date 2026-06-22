"""Skill gap analysis between resume and job description."""

from app.schemas.schemas import JobDescriptionAnalysis, ParsedResume, SkillGapAnalysis
from app.utils.text_utils import dedupe_preserve_order, contains_term


def analyze_skill_gap(resume: ParsedResume, jd: JobDescriptionAnalysis) -> SkillGapAnalysis:
  resume_skills = dedupe_preserve_order(resume.sections.skills)
  resume_text_lower = resume.raw_text.lower()
  jd_skills = dedupe_preserve_order(jd.technical_skills + jd.soft_skills)

  matching: list[str] = []
  missing: list[str] = []

  for skill in jd_skills:
    skill_lower = skill.lower()
    if skill_lower in {s.lower() for s in resume_skills} or contains_term(resume_text_lower, skill):
      matching.append(skill)
    else:
      missing.append(skill)

  # Recommended = missing high-priority skills that appear in requirements
  req_text = " ".join(jd.requirements).lower()
  recommended = [s for s in missing if s.lower() in req_text][:10]
  if not recommended:
    recommended = missing[:8]

  return SkillGapAnalysis(
    matching_skills=matching,
    missing_skills=missing,
    recommended_skills=recommended,
    resume_skills=resume_skills,
    jd_skills=jd_skills,
  )
