"""Resume upload, analysis, and history routes."""

import json
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.resume import ResumeRecord
from app.models.user import User
from app.schemas.schemas import (
  AnalyzeRequest,
  MessageResponse,
  OptimizationResult,
  ResumeRecordDetail,
  ResumeRecordResponse,
)
from app.services.document_parser import extract_text
from app.services.optimizer import optimize_resume, result_to_json

router = APIRouter(prefix="/resume", tags=["Resume"])

MAX_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

VALID_TEMPLATES = {
  "software_engineer", "data_analyst", "ai_ml_engineer",
  "full_stack", "cybersecurity", "generic",
}


def _validate_file(file: UploadFile) -> None:
  if not file.filename:
    raise HTTPException(status_code=400, detail="Filename is required")
  ext = Path(file.filename).suffix.lower()
  if ext not in settings.ALLOWED_EXTENSIONS:
    raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")


async def _read_upload(file: UploadFile) -> tuple[bytes, str]:
  _validate_file(file)
  content = await file.read()
  if len(content) > MAX_BYTES:
    raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")
  if not content:
    raise HTTPException(status_code=400, detail="Empty file uploaded")
  return content, file.filename or "upload.txt"


@router.post("/analyze", response_model=OptimizationResult)
async def analyze_resume(
  resume: UploadFile = File(...),
  job_description: str = Form(..., min_length=20),
  template: str = Form(default="generic"),
  save: bool = Form(default=True),
  title: str = Form(default=""),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  if template not in VALID_TEMPLATES:
    raise HTTPException(status_code=400, detail=f"Invalid template. Choose from: {VALID_TEMPLATES}")

  content, filename = await _read_upload(resume)
  try:
    resume_text = extract_text(content, filename)
  except ValueError as exc:
    raise HTTPException(status_code=400, detail=str(exc)) from exc

  result = optimize_resume(resume_text, job_description, template)

  if save:
    record = ResumeRecord(
      user_id=current_user.id,
      title=title or Path(filename).stem,
      template=template,
      original_filename=filename,
      original_text=resume_text,
      optimized_text=result.optimized_text,
      job_description=job_description,
      ats_score=result.scores.overall,
      keyword_score=result.scores.keyword_match,
      skill_score=result.scores.skill_match,
      experience_score=result.scores.experience_match,
      education_score=result.scores.education_match,
      formatting_score=result.scores.formatting,
      analysis_json=result_to_json(result),
      parsed_resume_json=json.dumps(result.optimized_resume.model_dump(), default=str),
      parsed_jd_json=json.dumps(result.job_analysis.model_dump(), default=str),
    )
    db.add(record)
    db.commit()

  return result


@router.post("/analyze-text", response_model=OptimizationResult)
def analyze_resume_text(
  resume_text: str = Form(..., min_length=50),
  job_description: str = Form(..., min_length=20),
  template: str = Form(default="generic"),
  save: bool = Form(default=False),
  title: str = Form(default="Pasted Resume"),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  if template not in VALID_TEMPLATES:
    raise HTTPException(status_code=400, detail=f"Invalid template. Choose from: {VALID_TEMPLATES}")

  result = optimize_resume(resume_text, job_description, template)

  if save:
    record = ResumeRecord(
      user_id=current_user.id,
      title=title,
      template=template,
      original_text=resume_text,
      optimized_text=result.optimized_text,
      job_description=job_description,
      ats_score=result.scores.overall,
      keyword_score=result.scores.keyword_match,
      skill_score=result.scores.skill_match,
      experience_score=result.scores.experience_match,
      education_score=result.scores.education_match,
      formatting_score=result.scores.formatting,
      analysis_json=result_to_json(result),
    )
    db.add(record)
    db.commit()

  return result


@router.post("/parse-jd")
async def parse_job_description(
  job_description: str = Form(default=""),
  file: UploadFile | None = File(default=None),
  current_user: User = Depends(get_current_user),
):
  from app.services.jd_analyzer import analyze_job_description as analyze_jd

  text = job_description
  if file and file.filename:
    content, filename = await _read_upload(file)
    try:
      text = extract_text(content, filename)
    except ValueError as exc:
      raise HTTPException(status_code=400, detail=str(exc)) from exc

  if len(text.strip()) < 20:
    raise HTTPException(status_code=400, detail="Job description must be at least 20 characters")

  return analyze_jd(text)


@router.get("/history", response_model=list[ResumeRecordResponse])
def get_history(
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  records = (
    db.query(ResumeRecord)
    .filter(ResumeRecord.user_id == current_user.id)
    .order_by(ResumeRecord.created_at.desc())
    .all()
  )
  return [ResumeRecordResponse.model_validate(r) for r in records]


@router.get("/history/{record_id}", response_model=ResumeRecordDetail)
def get_history_detail(
  record_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  record = (
    db.query(ResumeRecord)
    .filter(ResumeRecord.id == record_id, ResumeRecord.user_id == current_user.id)
    .first()
  )
  if not record:
    raise HTTPException(status_code=404, detail="Record not found")

  detail = ResumeRecordDetail.model_validate(record)
  if record.analysis_json:
    try:
      detail.analysis_json = json.loads(record.analysis_json)
    except json.JSONDecodeError:
      pass
  return detail


@router.delete("/history/{record_id}", response_model=MessageResponse)
def delete_history_record(
  record_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  record = (
    db.query(ResumeRecord)
    .filter(ResumeRecord.id == record_id, ResumeRecord.user_id == current_user.id)
    .first()
  )
  if not record:
    raise HTTPException(status_code=404, detail="Record not found")
  db.delete(record)
  db.commit()
  return MessageResponse(message="Record deleted successfully")
