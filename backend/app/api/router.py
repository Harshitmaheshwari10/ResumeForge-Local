"""API router aggregation."""

from fastapi import APIRouter

from app.api.routes import auth, export, resume

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(resume.router)
api_router.include_router(export.router)
