"""
B2B Agentik Platform - Main Application Entry Point
FastAPI application with full procurement intelligence capabilities.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.config import settings
from app.database import init_supabase, supabase_client
from app.redis_client import init_redis, close_redis
from app.api.routes import rfqs, suppliers, offers, orchestration, catalog, auth, health


logger.remove()
logger.add(sys.stdout, level="INFO", format="{time:HH:mm:ss} | {level:<7} | {message}")
logger.add("logs/app.log", rotation="10 MB", retention="7 days", level="DEBUG")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting B2B Agentik Platform...")
    init_supabase()
    await init_redis()
    logger.info(f"Environment: {settings.app_env}")
    yield
    await close_redis()
    logger.info("Shutting down B2B Agentik Platform.")


app = FastAPI(
    title="B2B Agentik Platform",
    description="AI-powered procurement intelligence with 3000+ parameter decision engine",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(health.router)
app.include_router(auth.router, prefix="/api")
app.include_router(rfqs.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(offers.router, prefix="/api")
app.include_router(orchestration.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "B2B Agentik Platform",
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
    }
