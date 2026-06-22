"""Pydantic request/response schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---

class UserCreate(BaseModel):
  email: EmailStr
  full_name: str = Field(min_length=2, max_length=255)
  password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
  email: EmailStr
  password: str


class UserResponse(BaseModel):
  id: int
  email: str
  full_name: str
  is_active: bool
  created_at: datetime

  class Config:
    from_attributes = True


class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"
  user: UserResponse


# --- Resume ---

class ResumeSection(BaseModel):
  contact: dict[str, str] = {}
  summary: str = ""
  education: list[dict[str, Any]] = []
  experience: list[dict[str, Any]] = []
  projects: list[dict[str, Any]] = []
  skills: list[str] = []
  certifications: list[str] = []
  achievements: list[str] = []


class ParsedResume(BaseModel):
  raw_text: str
  sections: ResumeSection
  word_count: int = 0


class JobDescriptionAnalysis(BaseModel):
  raw_text: str
  technical_skills: list[str] = []
  soft_skills: list[str] = []
  responsibilities: list[str] = []
  requirements: list[str] = []
  keywords: list[str] = []
  high_priority_keywords: list[str] = []


class ScoreBreakdown(BaseModel):
  keyword_match: float
  skill_match: float
  experience_match: float
  education_match: float
  formatting: float
  overall: float


class KeywordAnalysis(BaseModel):
  found_keywords: list[str]
  missing_keywords: list[str]
  high_priority_keywords: list[str]
  keyword_frequency: dict[str, int]


class SkillGapAnalysis(BaseModel):
  matching_skills: list[str]
  missing_skills: list[str]
  recommended_skills: list[str]
  resume_skills: list[str]
  jd_skills: list[str]


class OptimizationResult(BaseModel):
  original_resume: ParsedResume
  optimized_resume: ParsedResume
  optimized_text: str
  job_analysis: JobDescriptionAnalysis
  scores: ScoreBreakdown
  keyword_analysis: KeywordAnalysis
  skill_gap: SkillGapAnalysis
  suggestions: list[str]
  template: str = "generic"


class ResumeRecordResponse(BaseModel):
  id: int
  title: str
  template: str
  original_filename: str | None
  ats_score: float
  keyword_score: float
  skill_score: float
  experience_score: float
  education_score: float
  formatting_score: float
  created_at: datetime
  updated_at: datetime

  class Config:
    from_attributes = True


class ResumeRecordDetail(ResumeRecordResponse):
  original_text: str | None
  optimized_text: str | None
  job_description: str | None
  analysis_json: dict[str, Any] | None = None


class AnalyzeRequest(BaseModel):
  job_description: str = Field(min_length=20)
  template: str = "generic"


class MessageResponse(BaseModel):
  message: str
