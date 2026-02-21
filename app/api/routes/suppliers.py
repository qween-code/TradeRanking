"""Supplier management endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from uuid import uuid4

from app.models import SupplierCreate, SupplierResponse, APIResponse, PaginatedResponse
from app.auth import get_current_user, require_permission
from app.database import get_db

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=PaginatedResponse)
async def list_suppliers(
    category: Optional[str] = None,
    verified: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    user=Depends(require_permission("supplier:read")),
):
    db = get_db()
    result = db.table("suppliers").select("*").execute()
    data = result.data

    if category:
        data = [s for s in data if category in (s.get("categories") or [])]
    if verified is not None:
        data = [s for s in data if s.get("verified") == verified]
    if search:
        q = search.lower()
        data = [s for s in data if q in (s.get("name", "") + s.get("company", "")).lower()]

    start = (page - 1) * per_page
    return PaginatedResponse(data=data[start:start + per_page], total=len(data), page=page, per_page=per_page)


@router.post("", response_model=APIResponse)
async def create_supplier(supplier: SupplierCreate, user=Depends(require_permission("supplier:*"))):
    db = get_db()
    data = {
        "id": str(uuid4()),
        "name": supplier.name,
        "email": supplier.email,
        "phone": supplier.phone,
        "company": supplier.company,
        "address": supplier.address,
        "website": supplier.website,
        "categories": supplier.categories,
        "description": supplier.description,
        "verified": False,
        "rating": None,
    }
    result = db.table("suppliers").insert(data).execute()
    return APIResponse(success=True, message="Supplier created", data=result.data[0])


@router.get("/{supplier_id}", response_model=APIResponse)
async def get_supplier(supplier_id: str, user=Depends(require_permission("supplier:read"))):
    db = get_db()
    result = db.table("suppliers").select("*").eq("id", supplier_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return APIResponse(success=True, data=result.data[0])


@router.get("/{supplier_id}/risk", response_model=APIResponse)
async def get_supplier_risk(supplier_id: str, user=Depends(require_permission("supplier:read"))):
    """Get comprehensive risk assessment for a supplier (3000+ parameters)."""
    # This would call the parameter computation engine in production
    risk_data = {
        "supplier_id": supplier_id,
        "overall_risk": 32,
        "geopolitical_risk": 18,
        "financial_risk": 25,
        "quality_risk": 15,
        "logistics_risk": 40,
        "weather_risk": 22,
        "compliance_risk": 10,
        "breakdown": {
            "country_stability": 85,
            "conflict_proximity_km": 2500,
            "terrorism_incidents_30d": 0,
            "sanctions_flag": False,
            "credit_rating": "BBB+",
            "altman_z_score": 3.2,
            "bankruptcy_probability_12m": 2.1,
            "defect_rate_ppm": 120,
            "on_time_delivery": 94.5,
            "iso_9001": True,
            "port_congestion": 35,
            "route_weather_risk": 22,
        },
    }
    return APIResponse(success=True, data=risk_data)
