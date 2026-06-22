"""Application configuration."""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
  """Runtime settings loaded from environment or defaults."""

  APP_NAME: str = "ResumeForge Local"
  APP_VERSION: str = "1.0.0"
  API_PREFIX: str = "/api/v1"

  BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
  DATA_DIR: Path = BASE_DIR / "data"
  UPLOAD_DIR: Path = DATA_DIR / "uploads"
  EXPORT_DIR: Path = DATA_DIR / "exports"

  DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'resumeforge.db'}"

  SECRET_KEY: str = "resumeforge-local-dev-secret-change-in-production"
  ALGORITHM: str = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

  MAX_UPLOAD_SIZE_MB: int = 10
  ALLOWED_EXTENSIONS: set[str] = {".pdf", ".docx", ".txt"}

  CORS_ORIGINS: list[str] = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ]

  class Config:
    env_file = ".env"


settings = Settings()

# Ensure data directories exist at import time
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.EXPORT_DIR.mkdir(parents=True, exist_ok=True)
