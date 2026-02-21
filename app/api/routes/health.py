"""Health check endpoint."""

from fastapi import APIRouter
from datetime import datetime
from app.config import settings
from app.database import get_db
from app.redis_client import get_redis

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    checks = {"api": {"status": "healthy", "version": settings.app_version}}

    # Supabase check
    try:
        db = get_db()
        if db:
            checks["supabase"] = {"status": "healthy", "connected": True}
        else:
            checks["supabase"] = {"status": "degraded", "connected": False}
    except Exception as e:
        checks["supabase"] = {"status": "unhealthy", "error": str(e)}

    # Redis check
    try:
        r = get_redis()
        if r:
            await r.ping()
            checks["redis"] = {"status": "healthy", "connected": True}
        else:
            checks["redis"] = {"status": "degraded", "connected": False}
    except Exception as e:
        checks["redis"] = {"status": "unhealthy", "error": str(e)}

    overall = "healthy" if all(c.get("status") == "healthy" for c in checks.values()) else "degraded"

    return {
        "status": overall,
        "timestamp": datetime.utcnow().isoformat(),
        "services": checks,
    }
