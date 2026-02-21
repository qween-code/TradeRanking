"""Offer management endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from uuid import uuid4

from app.models import OfferCreate, OfferResponse, APIResponse, PaginatedResponse
from app.auth import get_current_user, require_permission
from app.database import get_db

router = APIRouter(prefix="/offers", tags=["offers"])


@router.get("", response_model=PaginatedResponse)
async def list_offers(page: int = 1, per_page: int = 20, user=Depends(require_permission("offer:read"))):
    db = get_db()
    result = db.table("offers").select("*").execute()
    data = result.data
    start = (page - 1) * per_page
    return PaginatedResponse(data=data[start:start + per_page], total=len(data), page=page, per_page=per_page)


@router.get("/by-rfq/{rfq_id}", response_model=APIResponse)
async def get_offers_by_rfq(rfq_id: str, user=Depends(require_permission("offer:read"))):
    db = get_db()
    result = db.table("offers").select("*").eq("rfq_id", rfq_id).execute()
    return APIResponse(success=True, data=result.data)


@router.post("", response_model=APIResponse)
async def create_offer(offer: OfferCreate, user=Depends(require_permission("offer:create"))):
    db = get_db()
    data = {
        "id": str(uuid4()),
        "rfq_id": offer.rfq_id,
        "supplier_id": offer.supplier_id,
        "unit_price": offer.unit_price,
        "total_price": offer.total_price,
        "delivery_time": offer.delivery_time,
        "terms": offer.terms,
        "notes": offer.notes,
        "status": "submitted",
    }
    result = db.table("offers").insert(data).execute()
    return APIResponse(success=True, message="Offer submitted", data=result.data[0])


@router.get("/{offer_id}", response_model=APIResponse)
async def get_offer(offer_id: str, user=Depends(require_permission("offer:read"))):
    db = get_db()
    result = db.table("offers").select("*").eq("id", offer_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Offer not found")
    return APIResponse(success=True, data=result.data[0])


@router.put("/{offer_id}/accept", response_model=APIResponse)
async def accept_offer(offer_id: str, user=Depends(require_permission("offer:read"))):
    db = get_db()
    result = db.table("offers").update({"status": "accepted"}).eq("id", offer_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Offer not found")
    return APIResponse(success=True, message="Offer accepted", data=result.data[0])


@router.put("/{offer_id}/reject", response_model=APIResponse)
async def reject_offer(offer_id: str, user=Depends(require_permission("offer:read"))):
    db = get_db()
    result = db.table("offers").update({"status": "rejected"}).eq("id", offer_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Offer not found")
    return APIResponse(success=True, message="Offer rejected", data=result.data[0])
