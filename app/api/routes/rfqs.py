"""RFQ management endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from uuid import uuid4

from app.models import (
    RFQCreate, RFQUpdate, RFQResponse, RFQTemplate,
    APIResponse, PaginatedResponse, RFQStatus
)
from app.auth import get_current_user, require_permission
from app.database import get_db

router = APIRouter(prefix="/rfqs", tags=["rfqs"])

# ─── Industry-Specific RFQ Templates ─────────────────────

TEMPLATES = {
    "metals": RFQTemplate(
        category="metals",
        title_template="Metal Procurement - {material}",
        fields=[
            {"name": "material", "type": "select", "options": ["Steel", "Aluminum", "Copper", "Zinc", "Titanium"]},
            {"name": "grade", "type": "text", "placeholder": "e.g., 304, 316, 6061"},
            {"name": "form", "type": "select", "options": ["Sheet", "Coil", "Bar", "Tube", "Wire"]},
            {"name": "thickness_mm", "type": "number"},
            {"name": "width_mm", "type": "number"},
            {"name": "certification_required", "type": "multiselect", "options": ["ISO 9001", "Mill Certificate", "Chemical Analysis"]},
        ],
        default_requirements={"inspection": "pre-shipment", "packaging": "export-standard"},
    ),
    "electronics": RFQTemplate(
        category="electronics",
        title_template="Electronics Procurement - {component}",
        fields=[
            {"name": "component", "type": "text", "placeholder": "e.g., Microcontroller, Capacitor"},
            {"name": "manufacturer", "type": "text"},
            {"name": "part_number", "type": "text"},
            {"name": "lead_free", "type": "boolean", "default": True},
            {"name": "rohs_compliant", "type": "boolean", "default": True},
        ],
        default_requirements={"compliance": ["RoHS", "REACH"], "packaging": "anti-static"},
    ),
    "chemicals": RFQTemplate(
        category="chemicals",
        title_template="Chemical Procurement - {chemical}",
        fields=[
            {"name": "chemical", "type": "text"},
            {"name": "cas_number", "type": "text"},
            {"name": "purity_percent", "type": "number"},
            {"name": "packaging_type", "type": "select", "options": ["Drum", "IBC", "Tanker", "Bag"]},
            {"name": "sds_required", "type": "boolean", "default": True},
        ],
        default_requirements={"documentation": ["SDS", "COA"], "hazmat": True},
    ),
    "textiles": RFQTemplate(
        category="textiles",
        title_template="Textile Procurement - {fabric}",
        fields=[
            {"name": "fabric", "type": "text"},
            {"name": "composition", "type": "text", "placeholder": "e.g., 100% Cotton"},
            {"name": "weight_gsm", "type": "number"},
            {"name": "width_cm", "type": "number"},
            {"name": "color", "type": "text"},
            {"name": "oeko_tex_required", "type": "boolean"},
        ],
        default_requirements={},
    ),
    "machinery": RFQTemplate(
        category="machinery",
        title_template="Machinery Procurement - {equipment}",
        fields=[
            {"name": "equipment", "type": "text"},
            {"name": "brand_preference", "type": "text"},
            {"name": "power_kw", "type": "number"},
            {"name": "voltage", "type": "select", "options": ["110V", "220V", "380V", "440V"]},
            {"name": "warranty_months", "type": "number", "default": 12},
            {"name": "installation_required", "type": "boolean"},
        ],
        default_requirements={"documentation": ["Manual", "CE Certificate"], "training": True},
    ),
}


@router.get("", response_model=PaginatedResponse)
async def list_rfqs(
    status: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    user=Depends(require_permission("rfq:read")),
):
    db = get_db()
    query = db.table("rfqs").select("*")
    if status:
        query = query.eq("status", status)
    if category:
        query = query.eq("category", category)

    result = query.execute()
    data = result.data
    start = (page - 1) * per_page
    end = start + per_page

    return PaginatedResponse(data=data[start:end], total=len(data), page=page, per_page=per_page)


@router.post("", response_model=APIResponse)
async def create_rfq(rfq: RFQCreate, user=Depends(require_permission("rfq:create"))):
    db = get_db()
    rfq_data = {
        "id": str(uuid4()),
        "title": rfq.title,
        "description": rfq.description,
        "category": rfq.category,
        "quantity": rfq.quantity,
        "unit": rfq.unit,
        "budget_min": rfq.budget_min,
        "budget_max": rfq.budget_max,
        "deadline_date": rfq.deadline_date.isoformat() if rfq.deadline_date else None,
        "delivery_location": rfq.delivery_location,
        "requirements": rfq.requirements,
        "urgency": rfq.urgency.value,
        "status": RFQStatus.DRAFT.value,
        "requester_id": user.id,
    }
    result = db.table("rfqs").insert(rfq_data).execute()
    return APIResponse(success=True, message="RFQ created", data=result.data[0])


@router.get("/templates")
async def list_templates():
    return APIResponse(success=True, data={k: v.model_dump() for k, v in TEMPLATES.items()})


@router.get("/templates/{category}")
async def get_template(category: str):
    if category not in TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Template '{category}' not found")
    return APIResponse(success=True, data=TEMPLATES[category].model_dump())


@router.get("/{rfq_id}", response_model=APIResponse)
async def get_rfq(rfq_id: str, user=Depends(require_permission("rfq:read"))):
    db = get_db()
    result = db.table("rfqs").select("*").eq("id", rfq_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return APIResponse(success=True, data=result.data[0])


@router.put("/{rfq_id}", response_model=APIResponse)
async def update_rfq(rfq_id: str, rfq: RFQUpdate, user=Depends(require_permission("rfq:update"))):
    db = get_db()
    update_data = {k: v for k, v in rfq.model_dump(exclude_none=True).items()}
    if "deadline_date" in update_data and update_data["deadline_date"]:
        update_data["deadline_date"] = update_data["deadline_date"].isoformat()
    if "urgency" in update_data:
        update_data["urgency"] = update_data["urgency"].value
    if "status" in update_data:
        update_data["status"] = update_data["status"].value

    result = db.table("rfqs").update(update_data).eq("id", rfq_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return APIResponse(success=True, message="RFQ updated", data=result.data[0])


@router.delete("/{rfq_id}", response_model=APIResponse)
async def delete_rfq(rfq_id: str, user=Depends(require_permission("rfq:delete"))):
    db = get_db()
    db.table("rfqs").delete().eq("id", rfq_id).execute()
    return APIResponse(success=True, message="RFQ deleted")
