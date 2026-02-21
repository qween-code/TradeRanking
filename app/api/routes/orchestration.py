"""Agent orchestration endpoints - start jobs, check status."""

from fastapi import APIRouter, Depends, HTTPException
from uuid import uuid4

from app.models import JobCreate, JobResponse, JobStatusResponse, APIResponse
from app.auth import get_current_user, require_permission
from app.database import get_db
from app.redis_client import RedisJobManager, get_redis

router = APIRouter(prefix="/orchestrate", tags=["orchestration"])


@router.post("", response_model=APIResponse)
async def start_job(job: JobCreate, user=Depends(require_permission("job:create"))):
    """Start an AI agent pipeline job for an RFQ."""
    db = get_db()

    # Verify RFQ exists
    rfq = db.table("rfqs").select("*").eq("id", job.rfq_id).execute()
    if not rfq.data:
        raise HTTPException(status_code=404, detail="RFQ not found")

    job_id = str(uuid4())
    job_data = {
        "id": job_id,
        "user_id": user.id,
        "rfq_id": job.rfq_id,
        "job_type": job.job_type.value,
        "status": "queued",
        "result": None,
        "error": None,
    }
    db.table("jobs").insert(job_data).execute()

    # Enqueue to Redis
    redis = get_redis()
    if redis:
        manager = RedisJobManager(redis)
        await manager.enqueue_job(job_id, {
            "job_id": job_id,
            "user_id": user.id,
            "rfq_id": job.rfq_id,
            "job_type": job.job_type.value,
            "rfq_data": rfq.data[0],
        })

    return APIResponse(success=True, message="Job queued", data={"job_id": job_id, "status": "queued"})


@router.get("/status/{job_id}", response_model=APIResponse)
async def get_job_status(job_id: str, user=Depends(get_current_user)):
    """Get real-time status of a running job."""
    # Try Redis first for real-time status
    redis = get_redis()
    if redis:
        manager = RedisJobManager(redis)
        status = await manager.get_job_status(job_id)
        if status:
            return APIResponse(success=True, data=status)

    # Fallback to database
    db = get_db()
    result = db.table("jobs").select("*").eq("id", job_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return APIResponse(success=True, data=result.data[0])


@router.get("/recent", response_model=APIResponse)
async def get_recent_jobs(limit: int = 20, user=Depends(get_current_user)):
    """List recent jobs for the current user."""
    db = get_db()
    result = db.table("jobs").select("*").eq("user_id", user.id).execute()
    data = sorted(result.data, key=lambda x: x.get("created_at", ""), reverse=True)[:limit]
    return APIResponse(success=True, data=data)


@router.get("/history", response_model=APIResponse)
async def get_job_history(page: int = 1, per_page: int = 20, user=Depends(get_current_user)):
    """List all job history for the current user."""
    db = get_db()
    result = db.table("jobs").select("*").eq("user_id", user.id).execute()
    data = sorted(result.data, key=lambda x: x.get("created_at", ""), reverse=True)
    start = (page - 1) * per_page
    return APIResponse(success=True, data=data[start:start + per_page])


@router.delete("/{job_id}", response_model=APIResponse)
async def cancel_job(job_id: str, user=Depends(get_current_user)):
    """Cancel a running job."""
    db = get_db()
    result = db.table("jobs").update({"status": "failed", "error": "Cancelled by user"}).eq("id", job_id).execute()

    redis = get_redis()
    if redis:
        manager = RedisJobManager(redis)
        await manager.set_job_status(job_id, "failed", error="Cancelled by user")

    return APIResponse(success=True, message="Job cancelled")
