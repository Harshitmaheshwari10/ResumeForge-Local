"""Resume history ORM model."""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class ResumeRecord(Base):
  __tablename__ = "resume_records"

  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
  title = Column(String(255), default="Untitled Resume")
  template = Column(String(100), default="generic")

  original_filename = Column(String(500))
  original_text = Column(Text)
  optimized_text = Column(Text)
  job_description = Column(Text)

  ats_score = Column(Float, default=0.0)
  keyword_score = Column(Float, default=0.0)
  skill_score = Column(Float, default=0.0)
  experience_score = Column(Float, default=0.0)
  education_score = Column(Float, default=0.0)
  formatting_score = Column(Float, default=0.0)

  analysis_json = Column(Text)  # JSON blob for detailed breakdown
  parsed_resume_json = Column(Text)
  parsed_jd_json = Column(Text)

  created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
  updated_at = Column(
    DateTime,
    default=lambda: datetime.now(timezone.utc),
    onupdate=lambda: datetime.now(timezone.utc),
  )

  owner = relationship("User", back_populates="resumes")
