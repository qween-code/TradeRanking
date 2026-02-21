import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { rfqApi } from '../services/api'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  ChevronRight,
  X,
} from 'lucide-react'

interface RFQItem {
  id: string
  title: string
  description: string
  category: string
  status: string
  urgency: string
  deadline: string
  currency: string
  budget_min?: number
  budget_max?: number
  delivery_country: string
  created_at: string
  offer_count?: number
  items?: { product_name: string }[]
}

const urgencyColors: Record<string, string> = {
  low: 'border-l-green-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-orange-400',
  critical: 'border-l-red-400',
}

export default function RFQsPage() {
  const [rfqs, setRfqs] = useState<RFQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'metals',
    urgency: 'medium',
    deadline: '',
    currency: 'USD',
    budget_min: 0,
    budget_max: 0,
    delivery_country: '',
    delivery_city: '',
    incoterm: 'FOB',
    items: [{ product_name: '', quantity: 1, unit: 'kg', hs_code: '' }],
  })

  useEffect(() => {
    loadRFQs()
  }, [statusFilter])

  const loadRFQs = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { limit: 50 }
      if (statusFilter) params.status = statusFilter
      const res = await rfqApi.list(params as { status?: string; skip?: number; limit?: number })
      setRfqs(res.data.data || res.data || [])
    } catch {
      setRfqs([])
    } finally {
      setLoading(false)
    }
  }

  const createRFQ = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await rfqApi.create(form)
      setShowCreate(false)
      setForm({
        title: '', description: '', category: 'metals', urgency: 'medium',
        deadline: '', currency: 'USD', budget_min: 0, budget_max: 0,
        delivery_country: '', delivery_city: '', incoterm: 'FOB',
        items: [{ product_name: '', quantity: 1, unit: 'kg', hs_code: '' }],
      })
      loadRFQs()
    } catch {
      // Handle error
    } finally {
      setCreating(false)
    }
  }

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { product_name: '', quantity: 1, unit: 'kg', hs_code: '' }],
    })
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const items = [...form.items]
    items[index] = { ...items[index], [field]: value }
    setForm({ ...form, items })
  }

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })
  }

  const filteredRfqs = rfqs.filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <TopBar title="RFQ Management" subtitle="Create and manage Request for Quotations" />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search RFQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="in_review">In Review</option>
              <option value="awarded">Awarded</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New RFQ
            </button>
          </div>
        </div>

        {/* RFQ List */}
        {loading ? (
          <LoadingSpinner text="Loading RFQs..." />
        ) : filteredRfqs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No RFQs found"
            description="Create your first RFQ to start collecting offers from suppliers."
            action={{ label: 'Create RFQ', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div className="space-y-3">
            {filteredRfqs.map((rfq) => (
              <div
                key={rfq.id}
                className={`bg-white rounded-xl border border-gray-200 border-l-4 ${
                  urgencyColors[rfq.urgency] || 'border-l-gray-300'
                } p-5 hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{rfq.title}</h3>
                      <StatusBadge status={rfq.status} />
                      <StatusBadge status={rfq.urgency} />
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-3">{rfq.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" />
                        {rfq.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : 'No deadline'}
                      </span>
                      {rfq.budget_max ? (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {rfq.budget_min?.toLocaleString()} - {rfq.budget_max.toLocaleString()} {rfq.currency}
                        </span>
                      ) : null}
                      {rfq.delivery_country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {rfq.delivery_country}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{rfq.offer_count ?? 0}</p>
                      <p className="text-xs text-gray-500">offers</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create RFQ Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Create New RFQ</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createRFQ} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text" required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Stainless Steel 304 Procurement"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Detailed requirements..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="metals">Metals & Alloys</option>
                    <option value="electronics">Electronics & Components</option>
                    <option value="chemicals">Chemicals & Polymers</option>
                    <option value="textiles">Textiles & Fabrics</option>
                    <option value="machinery">Machinery & Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input type="date" value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incoterm</label>
                  <select value={form.incoterm} onChange={(e) => setForm({ ...form, incoterm: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    {['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                    {['USD', 'EUR', 'GBP', 'TRY', 'CNY', 'JPY'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Min</label>
                  <input type="number" value={form.budget_min}
                    onChange={(e) => setForm({ ...form, budget_min: +e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Max</label>
                  <input type="number" value={form.budget_max}
                    onChange={(e) => setForm({ ...form, budget_max: +e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Country</label>
                  <input type="text" value={form.delivery_country}
                    onChange={(e) => setForm({ ...form, delivery_country: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Turkey"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery City</label>
                  <input type="text" value={form.delivery_city}
                    onChange={(e) => setForm({ ...form, delivery_city: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Istanbul"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items</label>
                  <button type="button" onClick={addItem}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <input type="text" placeholder="Product name" value={item.product_name}
                        onChange={(e) => updateItem(i, 'product_name', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <input type="number" placeholder="Qty" value={item.quantity} min={1}
                        onChange={(e) => updateItem(i, 'quantity', +e.target.value)}
                        className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      <select value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)}
                        className="w-20 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                        {['kg', 'ton', 'pcs', 'mt', 'lbs', 'ltr', 'set'].map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <input type="text" placeholder="HS Code" value={item.hs_code}
                        onChange={(e) => updateItem(i, 'hs_code', e.target.value)}
                        className="w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)}
                          className="p-2 text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create RFQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
