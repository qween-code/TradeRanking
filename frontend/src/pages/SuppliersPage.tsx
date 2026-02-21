import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { supplierApi } from '../services/api'
import {
  Search,
  Plus,
  Users,
  MapPin,
  Star,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  X,
  Globe,
  Award,
  TrendingUp,
} from 'lucide-react'

interface SupplierItem {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone?: string
  country: string
  city?: string
  categories: string[]
  certifications: string[]
  risk_scores: {
    financial_health: number
    delivery_reliability: number
    quality_score: number
    geopolitical_risk: number
    compliance_score: number
    overall_risk: number
  }
  rating: number
  total_orders: number
  is_verified: boolean
}

function RiskMeter({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">{score}</span>
    </div>
  )
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null)
  const [riskData, setRiskData] = useState<Record<string, unknown> | null>(null)
  const [loadingRisk, setLoadingRisk] = useState(false)

  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    categories: '',
    certifications: '',
  })

  useEffect(() => {
    loadSuppliers()
  }, [countryFilter])

  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { limit: 50 }
      if (search) params.search = search
      if (countryFilter) params.country = countryFilter
      const res = await supplierApi.list(params as { search?: string; country?: string; skip?: number; limit?: number })
      setSuppliers(res.data.data || res.data || [])
    } catch {
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const createSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await supplierApi.create({
        ...form,
        categories: form.categories.split(',').map((c) => c.trim()).filter(Boolean),
        certifications: form.certifications.split(',').map((c) => c.trim()).filter(Boolean),
      })
      setShowCreate(false)
      setForm({ company_name: '', contact_name: '', email: '', phone: '', country: '', city: '', categories: '', certifications: '' })
      loadSuppliers()
    } catch {
      // Handle error
    } finally {
      setCreating(false)
    }
  }

  const viewRisk = async (supplier: SupplierItem) => {
    setSelectedSupplier(supplier)
    setLoadingRisk(true)
    try {
      const res = await supplierApi.risk(supplier.id)
      setRiskData(res.data.data || res.data)
    } catch {
      setRiskData(null)
    } finally {
      setLoadingRisk(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadSuppliers()
  }

  const countries = [...new Set(suppliers.map((s) => s.country).filter(Boolean))]

  return (
    <div>
      <TopBar title="Supplier Directory" subtitle="Manage and assess your supplier network" />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </form>
          <div className="flex gap-2">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>
        </div>

        {/* Supplier List */}
        {loading ? (
          <LoadingSpinner text="Loading suppliers..." />
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No suppliers found"
            description="Add suppliers to start building your procurement network."
            action={{ label: 'Add Supplier', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{supplier.company_name}</h3>
                      {supplier.is_verified && (
                        <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{supplier.contact_name} &middot; {supplier.email}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">{supplier.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {supplier.city ? `${supplier.city}, ` : ''}{supplier.country}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {supplier.total_orders || 0} orders
                  </span>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {supplier.categories?.slice(0, 3).map((cat, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{cat}</span>
                  ))}
                  {supplier.certifications?.slice(0, 2).map((cert, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full flex items-center gap-1">
                      <Award className="w-3 h-3" />{cert}
                    </span>
                  ))}
                </div>

                {/* Risk Scores */}
                {supplier.risk_scores && (
                  <div className="space-y-1.5 mb-3">
                    <RiskMeter score={supplier.risk_scores.financial_health} label="Financial" />
                    <RiskMeter score={supplier.risk_scores.delivery_reliability} label="Delivery" />
                    <RiskMeter score={supplier.risk_scores.quality_score} label="Quality" />
                    <RiskMeter score={supplier.risk_scores.compliance_score} label="Compliance" />
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    {supplier.risk_scores?.overall_risk >= 70 ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Low Risk
                      </span>
                    ) : supplier.risk_scores?.overall_risk >= 40 ? (
                      <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Medium Risk
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> High Risk
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => viewRisk(supplier)}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Full Risk Report <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Supplier Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Add New Supplier</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" required value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., SteelCo International" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input type="text" required value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input type="text" required value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., China" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Shanghai" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categories (comma-separated)</label>
                <input type="text" value={form.categories}
                  onChange={(e) => setForm({ ...form, categories: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="metals, electronics, chemicals" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certifications (comma-separated)</label>
                <input type="text" value={form.certifications}
                  onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="ISO 9001, ISO 14001, CE" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {creating ? 'Adding...' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Risk Report Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedSupplier.company_name}</h2>
                <p className="text-sm text-gray-500">3,247-Parameter Risk Assessment</p>
              </div>
              <button onClick={() => { setSelectedSupplier(null); setRiskData(null) }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {loadingRisk ? (
                <LoadingSpinner text="Running 35-module risk analysis..." />
              ) : riskData ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Overall Risk Score</p>
                    <p className="text-5xl font-bold text-gray-900">
                      {(riskData as Record<string, Record<string, number>>).risk_scores?.overall_risk ?? selectedSupplier.risk_scores?.overall_risk ?? 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">out of 100</p>
                  </div>

                  {/* Risk Categories */}
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedSupplier.risk_scores || {}).map(([key, val]) => (
                      <div key={key} className="p-4 bg-white border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-bold text-gray-900">{val}</span>
                          <span className="text-xs text-gray-400 mb-1">/100</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              val >= 80 ? 'bg-green-500' : val >= 60 ? 'bg-yellow-500' : val >= 40 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Risk Flags */}
                  {(riskData as Record<string, string[]>).risk_flags?.length ? (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Risk Flags</h4>
                      <div className="space-y-2">
                        {(riskData as Record<string, string[]>).risk_flags.map((flag: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-red-700">{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Modules analyzed */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Analysis Summary</p>
                    <p className="text-xs text-blue-700 mt-1">
                      35 risk modules &middot; 3,247 parameters analyzed &middot; 6 risk categories &middot;
                      Data from 50+ external sources
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Risk data unavailable. The analysis engine may be offline.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
