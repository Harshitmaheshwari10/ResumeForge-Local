"""Export routes for PDF and DOCX generation."""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.resume import ResumeRecord
from app.models.user import User
from app.services.export_service import export_to_docx, export_to_pdf
from app.services.resume_parser import parse_resume

router = APIRouter(prefix="/export", tags=["Export"])


@router.post("/pdf")
def export_pdf(
  resume_text: str = Form(..., min_length=50),
  current_user: User = Depends(get_current_user),
):
  parsed = parse_resume(resume_text)
  filename = f"resume_{uuid.uuid4().hex[:8]}.pdf"
  output_path = settings.EXPORT_DIR / filename
  export_to_pdf(parsed.sections, output_path)
  return FileResponse(
    path=str(output_path),
    filename="optimized_resume.pdf",
    media_type="application/pdf",
  )


@router.post("/docx")
def export_docx(
  resume_text: str = Form(..., min_length=50),
  current_user: User = Depends(get_current_user),
):
  parsed = parse_resume(resume_text)
  filename = f"resume_{uuid.uuid4().hex[:8]}.docx"
  output_path = settings.EXPORT_DIR / filename
  export_to_docx(parsed.sections, output_path)
  return FileResponse(
    path=str(output_path),
    filename="optimized_resume.docx",
    media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  )


@router.get("/history/{record_id}/pdf")
def export_history_pdf(
  record_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  record = (
    db.query(ResumeRecord)
    .filter(ResumeRecord.id == record_id, ResumeRecord.user_id == current_user.id)
    .first()
  )
  if not record or not record.optimized_text:
    raise HTTPException(status_code=404, detail="Optimized resume not found")

  parsed = parse_resume(record.optimized_text)
  filename = f"resume_{record_id}_{uuid.uuid4().hex[:8]}.pdf"
  output_path = settings.EXPORT_DIR / filename
  export_to_pdf(parsed.sections, output_path)
  return FileResponse(path=str(output_path), filename=f"{record.title}.pdf", media_type="application/pdf")


@router.get("/history/{record_id}/docx")
def export_history_docx(
  record_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user),
):
  record = (
    db.query(ResumeRecord)
    .filter(ResumeRecord.id == record_id, ResumeRecord.user_id == current_user.id)
    .first()
  )
  if not record or not record.optimized_text:
    raise HTTPException(status_code=404, detail="Optimized resume not found")

  parsed = parse_resume(record.optimized_text)
  filename = f"resume_{record_id}_{uuid.uuid4().hex[:8]}.docx"
  output_path = settings.EXPORT_DIR / filename
  export_to_docx(parsed.sections, output_path)
  return FileResponse(
    path=str(output_path),
    filename=f"{record.title}.docx",
    media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  )
