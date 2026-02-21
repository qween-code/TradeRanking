"""Supplier product catalog endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from uuid import uuid4

from app.models import CatalogItemCreate, CatalogItemUpdate, CatalogItemResponse, APIResponse, PaginatedResponse
from app.auth import get_current_user, require_permission
from app.database import get_db

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/mine", response_model=PaginatedResponse)
async def my_catalog(page: int = 1, per_page: int = 20, user=Depends(require_permission("catalog:read"))):
    db = get_db()
    result = db.table("supplier_products").select("*").eq("supplier_id", user.id).execute()
    data = result.data
    start = (page - 1) * per_page
    return PaginatedResponse(data=data[start:start + per_page], total=len(data), page=page, per_page=per_page)


@router.get("/supplier/{supplier_id}", response_model=PaginatedResponse)
async def supplier_catalog(supplier_id: str, page: int = 1, per_page: int = 20, user=Depends(require_permission("catalog:read"))):
    db = get_db()
    result = db.table("supplier_products").select("*").eq("supplier_id", supplier_id).execute()
    data = result.data
    start = (page - 1) * per_page
    return PaginatedResponse(data=data[start:start + per_page], total=len(data), page=page, per_page=per_page)


@router.post("", response_model=APIResponse)
async def create_catalog_item(item: CatalogItemCreate, user=Depends(require_permission("catalog:create"))):
    db = get_db()
    data = {
        "id": str(uuid4()),
        "supplier_id": user.id,
        "product_name": item.product_name,
        "category": item.category,
        "price": item.price,
        "currency": item.currency,
        "description": item.description,
        "specifications": item.specifications,
    }
    result = db.table("supplier_products").insert(data).execute()
    return APIResponse(success=True, message="Catalog item created", data=result.data[0])


@router.put("/{item_id}", response_model=APIResponse)
async def update_catalog_item(item_id: str, item: CatalogItemUpdate, user=Depends(require_permission("catalog:update"))):
    db = get_db()
    update_data = {k: v for k, v in item.model_dump(exclude_none=True).items()}
    result = db.table("supplier_products").update(update_data).eq("id", item_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Catalog item not found")
    return APIResponse(success=True, message="Catalog item updated", data=result.data[0])


@router.delete("/{item_id}", response_model=APIResponse)
async def delete_catalog_item(item_id: str, user=Depends(require_permission("catalog:delete"))):
    db = get_db()
    db.table("supplier_products").delete().eq("id", item_id).execute()
    return APIResponse(success=True, message="Catalog item deleted")
