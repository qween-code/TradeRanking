// ─── User & Auth ─────────────────────────────────────────────────────
export type UserRole = 'admin' | 'buyer' | 'supplier' | 'manager'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  company?: string
  created_at?: string
}

// ─── RFQ ─────────────────────────────────────────────────────────────
export type RFQStatus = 'draft' | 'published' | 'in_review' | 'awarded' | 'closed' | 'cancelled'
export type Urgency = 'low' | 'medium' | 'high' | 'critical'

export interface RFQItem {
  product_name: string
  hs_code?: string
  quantity: number
  unit: string
  specifications?: Record<string, unknown>
}

export interface RFQ {
  id: string
  title: string
  description: string
  category: string
  items: RFQItem[]
  deadline: string
  urgency: Urgency
  status: RFQStatus
  budget_min?: number
  budget_max?: number
  currency: string
  delivery_country: string
  delivery_city?: string
  incoterm: string
  created_by: string
  created_at: string
  updated_at: string
  offer_count?: number
}

export interface RFQTemplate {
  id: string
  name: string
  category: string
  description: string
  fields: Record<string, unknown>[]
}

// ─── Supplier ────────────────────────────────────────────────────────
export interface RiskScores {
  financial_health: number
  delivery_reliability: number
  quality_score: number
  geopolitical_risk: number
  compliance_score: number
  overall_risk: number
}

export interface Supplier {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone?: string
  country: string
  city?: string
  categories: string[]
  certifications: string[]
  risk_scores: RiskScores
  rating: number
  total_orders: number
  is_verified: boolean
  created_at: string
}

// ─── Offer ───────────────────────────────────────────────────────────
export type OfferStatus = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'counter_offered' | 'withdrawn'

export interface OfferItem {
  product_name: string
  quantity: number
  unit_price: number
  currency: string
  lead_time_days: number
}

export interface Offer {
  id: string
  rfq_id: string
  supplier_id: string
  supplier_name?: string
  items: OfferItem[]
  total_amount: number
  currency: string
  delivery_date: string
  incoterm: string
  payment_terms: string
  validity_days: number
  notes?: string
  status: OfferStatus
  ai_score?: number
  risk_flags?: string[]
  created_at: string
}

// ─── Job / Orchestration ─────────────────────────────────────────────
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type JobType = 'full_pipeline' | 'supplier_discovery' | 'risk_assessment' | 'market_analysis' | 'negotiation'

export interface Job {
  id: string
  job_type: JobType
  status: JobStatus
  rfq_id?: string
  supplier_id?: string
  parameters?: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
  progress: number
  current_agent?: string
  created_by: string
  created_at: string
  updated_at: string
}

// ─── Analytics ───────────────────────────────────────────────────────
export interface DashboardStats {
  total_rfqs: number
  active_rfqs: number
  total_suppliers: number
  verified_suppliers: number
  total_offers: number
  pending_offers: number
  avg_response_time_hours: number
  cost_savings_percent: number
  active_jobs: number
}

// ─── API Response ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  total?: number
}
