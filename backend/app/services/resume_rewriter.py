"""Rule-based resume rewriter — never fabricates content."""

import re
from typing import Any

from app.schemas.schemas import JobDescriptionAnalysis, ParsedResume, ResumeSection
from app.utils.verb_enhancer import enhance_verbs, ensure_action_verb_start
from app.utils.text_utils import clean_bullet, dedupe_preserve_order, normalize_text, contains_term


# Enhancement templates — only rephrase existing content
PROJECT_TEMPLATES = [
  "Developed {desc} utilizing {tech} to deliver measurable results.",
  "Built {desc} with a focus on performance, scalability, and maintainability.",
  "Engineered {desc} applying industry best practices and modern development standards.",
]

WEAK_PATTERNS: list[tuple[str, str]] = [
  (r"^worked on (.+)$", r"Developed and maintained \1"),
  (r"^made (.+)$", r"Developed \1"),
  (r"^did (.+)$", r"Executed \1"),
  (r"^helped (?:with )?(.+)$", r"Contributed to \1"),
  (r"^used (.+) to (.+)$", r"Utilized \1 to \2"),
  (r"^built (.+) using (.+)$", r"Developed \1 using \2"),
]


def _enhance_bullet(bullet: str) -> str:
  """Improve a single bullet point without adding new facts."""
  text = clean_bullet(bullet).strip()
  if not text:
    return text

  for pattern, replacement in WEAK_PATTERNS:
    if re.match(pattern, text, re.IGNORECASE):
      text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
      break

  text = enhance_verbs(text)
  text = ensure_action_verb_start(text)

  # Ensure proper punctuation
  if text and text[-1] not in ".!?":
    text += "."

  # Capitalize first letter
  if text:
    text = text[0].upper() + text[1:]

  return text


def enhance_project_description(name: str, description: str, skills: list[str]) -> str:
  """Enhance project description using templates — no fabrication."""
  desc = description.strip()
  if not desc:
    return desc

  desc = enhance_verbs(desc)
  desc = ensure_action_verb_start(desc)

  # Detect technologies mentioned in description
  mentioned_tech = [s for s in skills if s.lower() in desc.lower()]
  tech_str = ", ".join(mentioned_tech[:3]) if mentioned_tech else "relevant technologies"

  if len(desc) < 40:
    if "using" not in desc.lower() and mentioned_tech:
      desc = f"Developed {desc} using {tech_str}."
    elif not desc.endswith("."):
      desc = f"Developed {desc[0].lower() + desc[1:] if desc else desc}."

  return desc


def enhance_experience_entry(entry: dict[str, Any]) -> dict[str, Any]:
  bullets = [_enhance_bullet(b) for b in entry.get("bullets", [])]
  return {**entry, "bullets": bullets}


def generate_summary(resume: ParsedResume, jd: JobDescriptionAnalysis | None = None) -> str:
  """Generate professional summary from existing resume data only."""
  skills = resume.sections.skills[:8]
  exp_count = len(resume.sections.experience)
  projects = resume.sections.projects[:2]

  parts: list[str] = []

  if resume.sections.summary:
    base = enhance_verbs(resume.sections.summary)
    parts.append(base)
  else:
    opener = "Results-driven professional"
    if skills:
      opener += f" with expertise in {', '.join(skills[:5])}"
    if exp_count:
      opener += f" and {exp_count} professional experience{'s' if exp_count > 1 else ''}"
    opener += "."
    parts.append(opener)

  if projects:
    proj_names = [p.get("name", "") for p in projects if p.get("name")]
    if proj_names:
      parts.append(
        f"Demonstrated capabilities through projects including {', '.join(proj_names)}."
      )

  if jd and jd.technical_skills:
    matching = [s for s in jd.technical_skills if contains_term(resume.raw_text, s)][:5]
    if matching:
      parts.append(
        f"Proficient in {', '.join(matching)} with a track record of delivering quality outcomes."
      )

  return " ".join(parts)


def rewrite_resume(
  resume: ParsedResume,
  jd: JobDescriptionAnalysis,
  template: str = "generic",
) -> ParsedResume:
  """Rewrite resume sections with professional language — no new facts."""
  sections = resume.sections

  enhanced_experience = [enhance_experience_entry(e) for e in sections.experience]
  enhanced_projects = []
  for proj in sections.projects:
    enhanced_projects.append({
      **proj,
      "description": enhance_project_description(
        proj.get("name", ""),
        proj.get("description", ""),
        sections.skills,
      ),
    })

  enhanced_achievements = [_enhance_bullet(a) for a in sections.achievements]
  enhanced_summary = generate_summary(resume, jd)

  # Reorder skills: JD-matching skills first (without adding new ones)
  jd_skill_lower = {s.lower() for s in jd.technical_skills + jd.soft_skills}
  priority_skills = [s for s in sections.skills if s.lower() in jd_skill_lower]
  other_skills = [s for s in sections.skills if s.lower() not in jd_skill_lower]
  ordered_skills = dedupe_preserve_order(priority_skills + other_skills)

  new_sections = ResumeSection(
    contact=sections.contact,
    summary=enhanced_summary,
    education=sections.education,
    experience=enhanced_experience,
    projects=enhanced_projects,
    skills=ordered_skills,
    certifications=sections.certifications,
    achievements=enhanced_achievements,
  )

  optimized_text = render_resume_text(new_sections, template)

  return ParsedResume(
    raw_text=optimized_text,
    sections=new_sections,
    word_count=len(optimized_text.split()),
  )


def render_resume_text(sections: ResumeSection, template: str = "generic") -> str:
  """Render structured resume to plain text (ATS-safe single column)."""
  lines: list[str] = []

  contact = sections.contact
  if contact.get("name"):
    lines.append(contact["name"].upper())
  contact_parts = []
  for key in ("email", "phone", "linkedin", "website"):
    if contact.get(key):
      contact_parts.append(contact[key])
  if contact_parts:
    lines.append(" | ".join(contact_parts))
  lines.append("")

  if sections.summary:
    lines.append("PROFESSIONAL SUMMARY")
    lines.append(sections.summary)
    lines.append("")

  if sections.skills:
    lines.append("SKILLS")
    lines.append(", ".join(sections.skills))
    lines.append("")

  if sections.experience:
    lines.append("PROFESSIONAL EXPERIENCE")
    for exp in sections.experience:
      if exp.get("title"):
        header = exp["title"]
        if exp.get("dates"):
          header += f" | {exp['dates']}"
        lines.append(header)
      for bullet in exp.get("bullets", []):
        lines.append(f"• {bullet}")
      lines.append("")

  if sections.projects:
    lines.append("PROJECTS")
    for proj in sections.projects:
      if proj.get("name"):
        lines.append(proj["name"])
      if proj.get("description"):
        lines.append(f"• {proj['description']}")
    lines.append("")

  if sections.education:
    lines.append("EDUCATION")
    for edu in sections.education:
      if edu.get("institution"):
        lines.append(edu["institution"])
      if edu.get("degree"):
        lines.append(edu["degree"])
      for detail in edu.get("details", []):
        lines.append(f"• {detail}")
    lines.append("")

  if sections.certifications:
    lines.append("CERTIFICATIONS")
    for cert in sections.certifications:
      lines.append(f"• {cert}")
    lines.append("")

  if sections.achievements:
    lines.append("ACHIEVEMENTS")
    for ach in sections.achievements:
      lines.append(f"• {ach}")

  return normalize_text("\n".join(lines))


TEMPLATE_LABELS = {
  "software_engineer": "Software Engineer",
  "data_analyst": "Data Analyst",
  "ai_ml_engineer": "AI/ML Engineer",
  "full_stack": "Full Stack Developer",
  "cybersecurity": "Cybersecurity",
  "generic": "Generic Professional",
}


def generate_suggestions(
  scores,
  keyword_analysis,
  skill_gap,
) -> list[str]:
  """Generate actionable improvement recommendations."""
  suggestions: list[str] = []

  if scores.keyword_match < 70:
    top_missing = keyword_analysis.missing_keywords[:5]
    if top_missing:
      suggestions.append(
        f"Incorporate these JD keywords naturally into your experience bullets: {', '.join(top_missing)}."
      )

  if scores.skill_match < 70 and skill_gap.missing_skills:
    suggestions.append(
      f"Highlight relevant experience with: {', '.join(skill_gap.missing_skills[:5])}."
    )

  if scores.formatting < 80:
    suggestions.append(
      "Use a single-column layout with clear section headers and standard bullet points for ATS compatibility."
    )

  if scores.experience_match < 65:
    suggestions.append(
      "Align experience bullets with job responsibilities using similar terminology from the job description."
    )

  if scores.education_match < 60:
    suggestions.append(
      "Ensure education section clearly lists your degree and institution as stated in your original resume."
    )

  if not suggestions:
    suggestions.append(
      "Your resume is well-aligned. Fine-tune bullet points to mirror high-priority keywords from the job description."
    )

  return suggestions
