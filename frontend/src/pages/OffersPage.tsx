import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { offerApi } from '../services/api'
import {
  Package,
  DollarSign,
  Calendar,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  AlertTriangle,
} from 'lucide-react'

interface OfferItem {
  id: string
  rfq_id: string
  supplier_id: string
  supplier_name?: string
  items: { product_name: string; quantity: number; unit_price: number; currency: string; lead_time_days: number }[]
  total_amount: number
  currency: string
  delivery_date: string
  incoterm: string
  payment_terms: string
  validity_days: number
  notes?: string
  status: string
  ai_score?: number
  risk_flags?: string[]
  created_at: string
}

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadOffers()
  }, [])

  const loadOffers = async () => {
    setLoading(true)
    try {
      const res = await offerApi.list({ limit: 50 })
      setOffers(res.data.data || res.data || [])
    } catch {
      setOffers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id: string) => {
    try {
      await offerApi.accept(id)
      loadOffers()
    } catch { /* */ }
  }

  const handleReject = async (id: string) => {
    try {
      await offerApi.reject(id)
      loadOffers()
    } catch { /* */ }
  }

  const filtered = offers.filter((o) => !statusFilter || o.status === statusFilter)

  return (
    <div>
      <TopBar title="Offers" subtitle="Review and manage supplier offers" />

      <div className="p-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['', 'pending', 'under_review', 'accepted', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        {/* Offer List */}
        {loading ? (
          <LoadingSpinner text="Loading offers..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No offers found"
            description="Offers will appear here when suppliers respond to your RFQs."
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((offer) => (
              <div key={offer.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {offer.supplier_name || `Supplier ${offer.supplier_id.slice(0, 8)}`}
                        </h3>
                        <StatusBadge status={offer.status} />
                      </div>
                      <p className="text-xs text-gray-500">RFQ: {offer.rfq_id.slice(0, 8)}...</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {offer.total_amount?.toLocaleString()} {offer.currency}
                      </p>
                      {offer.ai_score != null && (
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-medium text-gray-600">AI Score: {offer.ai_score}/100</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items table */}
                  {offer.items?.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2 font-medium text-gray-500">Product</th>
                            <th className="text-right py-2 font-medium text-gray-500">Qty</th>
                            <th className="text-right py-2 font-medium text-gray-500">Unit Price</th>
                            <th className="text-right py-2 font-medium text-gray-500">Lead Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {offer.items.map((item, i) => (
                            <tr key={i} className="border-b border-gray-50">
                              <td className="py-2 text-gray-900">{item.product_name}</td>
                              <td className="py-2 text-right text-gray-700">{item.quantity}</td>
                              <td className="py-2 text-right text-gray-700">{item.unit_price} {item.currency}</td>
                              <td className="py-2 text-right text-gray-700">{item.lead_time_days}d</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Delivery: {offer.delivery_date ? new Date(offer.delivery_date).toLocaleDateString() : 'TBD'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      {offer.incoterm}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {offer.payment_terms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Valid: {offer.validity_days} days
                    </span>
                  </div>

                  {/* Risk Flags */}
                  {offer.risk_flags?.length ? (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {offer.risk_flags.map((flag, i) => (
                        <span key={i} className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          {flag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {offer.notes && (
                    <p className="text-xs text-gray-500 italic mb-4">Note: {offer.notes}</p>
                  )}

                  {/* Actions */}
                  {offer.status === 'pending' && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleAccept(offer.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(offer.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
