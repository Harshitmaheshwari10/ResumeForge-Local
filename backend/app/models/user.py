"""User ORM model."""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True, index=True)
  email = Column(String(255), unique=True, index=True, nullable=False)
  full_name = Column(String(255), nullable=False)
  hashed_password = Column(String(255), nullable=False)
  is_active = Column(Boolean, default=True)
  created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

  resumes = relationship("ResumeRecord", back_populates="owner", cascade="all, delete-orphan")
