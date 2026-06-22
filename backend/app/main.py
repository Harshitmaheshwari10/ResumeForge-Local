"""ResumeForge Local — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
  init_db()
  logger.info("Database initialized")
  yield


app = FastAPI(
  title=settings.APP_NAME,
  version=settings.APP_VERSION,
  description="Local ATS Resume Optimizer — no external APIs required",
  lifespan=lifespan,
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.CORS_ORIGINS,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/health")
def health_check():
  return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
