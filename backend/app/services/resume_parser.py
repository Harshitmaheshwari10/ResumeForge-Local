"""Resume section parser — extracts structured sections from raw text."""

import re
from typing import Any

from app.schemas.schemas import ParsedResume, ResumeSection
from app.utils.text_utils import clean_bullet, is_bullet_line, normalize_text


SECTION_PATTERNS: dict[str, list[str]] = {
  "contact": ["contact", "personal information", "personal details"],
  "summary": [
    "summary", "professional summary", "profile", "objective",
    "career objective", "about me", "professional profile",
  ],
  "education": ["education", "academic background", "academics", "qualifications"],
  "experience": [
    "experience", "work experience", "professional experience",
    "employment history", "work history", "career history",
  ],
  "projects": ["projects", "personal projects", "key projects", "project experience"],
  "skills": ["skills", "technical skills", "core competencies", "competencies", "technologies"],
  "certifications": ["certifications", "certificates", "licenses", "credentials"],
  "achievements": ["achievements", "awards", "honors", "accomplishments"],
}


def _is_section_header(line: str) -> tuple[str | None, str]:
  """Detect if a line is a section header; return section key and cleaned title."""
  cleaned = re.sub(r"[^a-zA-Z\s/&]", "", line).strip().lower()
  if not cleaned or len(cleaned) > 60:
    return None, line

  for section_key, aliases in SECTION_PATTERNS.items():
    for alias in aliases:
      if cleaned == alias or cleaned.startswith(alias + " "):
        return section_key, line.strip()
  return None, line


def _parse_contact(lines: list[str]) -> dict[str, str]:
  contact: dict[str, str] = {}
  email_re = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
  phone_re = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")
  url_re = re.compile(r"https?://\S+|www\.\S+|linkedin\.com/\S+|github\.com/\S+")

  for line in lines:
    if m := email_re.search(line):
      contact["email"] = m.group()
    if m := phone_re.search(line):
      contact["phone"] = m.group().strip()
    if m := url_re.search(line):
      key = "linkedin" if "linkedin" in m.group().lower() else "website"
      contact[key] = m.group()
    if not contact.get("name") and line and "@" not in line and "http" not in line.lower():
      if len(line.split()) <= 5 and not re.search(r"\d{3}", line):
        contact["name"] = line.strip()

  return contact


def _parse_bullet_section(content: str) -> list[str]:
  items: list[str] = []
  for line in content.split("\n"):
    line = line.strip()
    if not line:
      continue
    if is_bullet_line(line):
      items.append(clean_bullet(line))
    elif items and not _looks_like_header(line):
      items[-1] += " " + line
    elif not _looks_like_header(line) and len(line) > 10:
      items.append(line)
  return items


def _looks_like_header(line: str) -> bool:
  return line.isupper() or (len(line) < 60 and line.endswith(":"))


def _parse_experience(content: str) -> list[dict[str, Any]]:
  entries: list[dict[str, Any]] = []
  blocks = re.split(r"\n(?=[A-Z][^\n]{5,}(?:\|| at | - |\d{4}))", content)

  for block in blocks:
    block = block.strip()
    if not block:
      continue
    lines = block.split("\n")
    title_line = lines[0].strip()
    date_match = re.search(
      r"(\w+\s+\d{4}|\d{4})\s*[-–—]\s*(\w+\s+\d{4}|\d{4}|present|current)",
      block,
      re.IGNORECASE,
    )
    bullets = _parse_bullet_section("\n".join(lines[1:]))
    entries.append({
      "title": title_line,
      "dates": date_match.group(0) if date_match else "",
      "bullets": bullets,
      "raw": block,
    })

  if not entries:
    bullets = _parse_bullet_section(content)
    if bullets:
      entries.append({"title": "", "dates": "", "bullets": bullets, "raw": content})

  return entries


def _parse_education(content: str) -> list[dict[str, Any]]:
  entries: list[dict[str, Any]] = []
  for block in re.split(r"\n{2,}", content):
    block = block.strip()
    if not block:
      continue
    lines = [l.strip() for l in block.split("\n") if l.strip()]
    entries.append({
      "institution": lines[0] if lines else "",
      "degree": lines[1] if len(lines) > 1 else "",
      "details": lines[2:] if len(lines) > 2 else [],
      "raw": block,
    })
  return entries


def _parse_projects(content: str) -> list[dict[str, Any]]:
  projects: list[dict[str, Any]] = []
  blocks = re.split(r"\n{2,}", content)
  for block in blocks:
    block = block.strip()
    if not block:
      continue
    lines = block.split("\n")
    projects.append({
      "name": lines[0].strip(),
      "description": " ".join(clean_bullet(l) for l in lines[1:] if l.strip()),
      "raw": block,
    })
  return projects


def parse_resume(text: str) -> ParsedResume:
  """Parse raw resume text into structured sections."""
  text = normalize_text(text)
  lines = text.split("\n")

  sections: dict[str, list[str]] = {k: [] for k in SECTION_PATTERNS}
  current_section = "contact"
  section_content: dict[str, list[str]] = {k: [] for k in SECTION_PATTERNS}

  for line in lines:
    section_key, _ = _is_section_header(line)
    if section_key:
      current_section = section_key
      continue
    section_content[current_section].append(line)

  contact = _parse_contact(section_content["contact"] + lines[:5])
  summary = "\n".join(section_content["summary"]).strip()
  education = _parse_education("\n".join(section_content["education"]))
  experience = _parse_experience("\n".join(section_content["experience"]))
  projects = _parse_projects("\n".join(section_content["projects"]))

  skills_raw = "\n".join(section_content["skills"])
  skills = re.split(r"[,;|•\n]", skills_raw)
  skills = [s.strip() for s in skills if s.strip() and len(s.strip()) > 1]

  certifications = _parse_bullet_section("\n".join(section_content["certifications"]))
  achievements = _parse_bullet_section("\n".join(section_content["achievements"]))

  resume_section = ResumeSection(
    contact=contact,
    summary=summary,
    education=education,
    experience=experience,
    projects=projects,
    skills=skills,
    certifications=certifications,
    achievements=achievements,
  )

  return ParsedResume(
    raw_text=text,
    sections=resume_section,
    word_count=len(text.split()),
  )
