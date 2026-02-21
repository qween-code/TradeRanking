"""
Pydantic v2 data models for the B2B Agentik Platform.
All request/response schemas and domain entities.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
from uuid import UUID, uuid4


# ─── Enums ────────────────────────────────────────────────

class UserRole(str, Enum):
    ADMIN = "admin"
    BUYER = "buyer"
    SUPPLIER = "supplier"
    MANAGER = "manager"


class RFQStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Urgency(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class OfferStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class JobStatus(str, Enum):
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class JobType(str, Enum):
    FULL_PIPELINE = "full_pipeline"
    SUPPLIER_DISCOVERY = "supplier_discovery"
    EMAIL_SEND = "email_send"
    OFFER_ANALYSIS = "offer_analysis"


# ─── Auth Models ──────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class TokenData(BaseModel):
    user_id: str
    email: str
    role: UserRole


# ─── User Models ──────────────────────────────────────────

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.BUYER


class UserCreate(UserBase):
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    is_admin: bool = False
    created_at: Optional[datetime] = None


# ─── RFQ Models ───────────────────────────────────────────

class RFQBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline_date: Optional[date] = None
    delivery_location: Optional[str] = None
    requirements: Optional[Dict[str, Any]] = None
    urgency: Urgency = Urgency.MEDIUM


class RFQCreate(RFQBase):
    pass


class RFQUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline_date: Optional[date] = None
    delivery_location: Optional[str] = None
    requirements: Optional[Dict[str, Any]] = None
    urgency: Optional[Urgency] = None
    status: Optional[RFQStatus] = None


class RFQResponse(RFQBase):
    id: str
    status: RFQStatus = RFQStatus.DRAFT
    requester_id: Optional[str] = None
    company_id: Optional[str] = None
    attachments: Optional[List[Dict]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class RFQTemplate(BaseModel):
    category: str
    title_template: str
    fields: List[Dict[str, Any]]
    default_requirements: Optional[Dict[str, Any]] = None


# ─── Supplier Models ─────────────────────────────────────

class SupplierBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    categories: Optional[List[str]] = None
    description: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierResponse(SupplierBase):
    id: str
    verified: bool = False
    rating: Optional[float] = None
    risk_score: Optional[int] = None
    financial_health_score: Optional[int] = None
    quality_score: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Offer Models ─────────────────────────────────────────

class OfferBase(BaseModel):
    rfq_id: str
    supplier_id: str
    unit_price: float
    total_price: float
    delivery_time: Optional[int] = None
    terms: Optional[str] = None
    notes: Optional[str] = None


class OfferCreate(OfferBase):
    pass


class OfferResponse(OfferBase):
    id: str
    status: OfferStatus = OfferStatus.SUBMITTED
    submitted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    verification_score: Optional[float] = None
    verified: Optional[bool] = None
    risk_analysis: Optional[Dict[str, Any]] = None


# ─── Job / Orchestration Models ───────────────────────────

class JobCreate(BaseModel):
    rfq_id: str
    job_type: JobType = JobType.FULL_PIPELINE


class JobResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    rfq_id: Optional[str] = None
    job_type: Optional[str] = None
    status: JobStatus = JobStatus.QUEUED
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    current_agent: Optional[str] = None
    progress_percent: Optional[int] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ─── Catalog Models ───────────────────────────────────────

class CatalogItemBase(BaseModel):
    product_name: str
    category: Optional[str] = None
    price: Optional[float] = None
    currency: str = "USD"
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None


class CatalogItemCreate(CatalogItemBase):
    pass


class CatalogItemUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None


class CatalogItemResponse(CatalogItemBase):
    id: str
    supplier_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Negotiation Models ──────────────────────────────────

class NegotiationSessionCreate(BaseModel):
    rfq_id: str
    strategy: str = "balanced"
    max_rounds: int = 5


class NegotiationSessionResponse(BaseModel):
    id: str
    rfq_id: str
    user_id: str
    status: str
    strategy: str
    max_rounds: int
    current_round: int
    created_at: Optional[datetime] = None


class NegotiationRoundResponse(BaseModel):
    id: str
    session_id: str
    round_number: int
    action_type: str
    actor: str
    details: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None


class NegotiationOffer(BaseModel):
    id: str
    session_id: str
    supplier_id: str
    price: float
    lead_time_days: Optional[int] = None
    payment_terms: Optional[str] = None
    quality_score: Optional[float] = None
    overall_score: Optional[float] = None
    status: str = "active"


# ─── Risk & Parameter Models ─────────────────────────────

class RiskScoreResponse(BaseModel):
    supplier_id: str
    overall_risk: int = Field(ge=0, le=100)
    geopolitical_risk: int = Field(ge=0, le=100)
    financial_risk: int = Field(ge=0, le=100)
    quality_risk: int = Field(ge=0, le=100)
    logistics_risk: int = Field(ge=0, le=100)
    weather_risk: int = Field(ge=0, le=100)
    compliance_risk: int = Field(ge=0, le=100)
    breakdown: Optional[Dict[str, Any]] = None


class ParameterValueResponse(BaseModel):
    parameter_id: str
    entity_type: str
    entity_id: str
    value: Any
    computed_at: Optional[datetime] = None


# ─── Analytics Models ─────────────────────────────────────

class DashboardStats(BaseModel):
    total_rfqs: int = 0
    active_rfqs: int = 0
    total_suppliers: int = 0
    verified_suppliers: int = 0
    total_offers: int = 0
    pending_offers: int = 0
    active_jobs: int = 0
    avg_savings_percent: float = 0.0


class SpendAnalytics(BaseModel):
    total_spend: float = 0.0
    period: str = "monthly"
    by_category: Optional[Dict[str, float]] = None
    by_supplier: Optional[Dict[str, float]] = None
    trend: Optional[List[Dict[str, Any]]] = None


# ─── Generic API Response ─────────────────────────────────

class APIResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
    errors: Optional[List[str]] = None


class PaginatedResponse(BaseModel):
    success: bool = True
    data: List[Any] = []
    total: int = 0
    page: int = 1
    per_page: int = 20
