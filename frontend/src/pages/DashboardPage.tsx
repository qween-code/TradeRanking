import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/TopBar'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'
import { rfqApi, supplierApi, offerApi, orchestrationApi } from '../services/api'
import {
  FileText,
  Users,
  Package,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Bot,
  Activity,
} from 'lucide-react'

interface DashStats {
  rfqs: { total: number; active: number; recent: unknown[] }
  suppliers: { total: number; list: unknown[] }
  offers: { total: number; list: unknown[] }
  jobs: { recent: unknown[] }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [rfqRes, supplierRes, offerRes, jobRes] = await Promise.allSettled([
          rfqApi.list({ limit: 5 }),
          supplierApi.list({ limit: 5 }),
          offerApi.list({ limit: 5 }),
          orchestrationApi.recent(),
        ])

        const rfqData = rfqRes.status === 'fulfilled' ? rfqRes.value.data : { data: [], total: 0 }
        const supplierData = supplierRes.status === 'fulfilled' ? supplierRes.value.data : { data: [], total: 0 }
        const offerData = offerRes.status === 'fulfilled' ? offerRes.value.data : { data: [], total: 0 }
        const jobData = jobRes.status === 'fulfilled' ? jobRes.value.data : { data: [] }

        setStats({
          rfqs: {
            total: rfqData.total || (rfqData.data?.length ?? 0),
            active: rfqData.data?.filter?.((r: Record<string, string>) => r.status === 'published')?.length ?? 0,
            recent: rfqData.data || [],
          },
          suppliers: {
            total: supplierData.total || (supplierData.data?.length ?? 0),
            list: supplierData.data || [],
          },
          offers: {
            total: offerData.total || (offerData.data?.length ?? 0),
            list: offerData.data || [],
          },
          jobs: {
            recent: jobData.data || [],
          },
        })
      } catch {
        // Use fallback empty stats
        setStats({
          rfqs: { total: 0, active: 0, recent: [] },
          suppliers: { total: 0, list: [] },
          offers: { total: 0, list: [] },
          jobs: { recent: [] },
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />

  return (
    <div>
      <TopBar
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'User'}`}
        subtitle="Here's what's happening with your procurement pipeline"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total RFQs"
            value={stats?.rfqs.total ?? 0}
            change={`${stats?.rfqs.active ?? 0} active`}
            changeType="positive"
            icon={FileText}
          />
          <StatCard
            title="Suppliers"
            value={stats?.suppliers.total ?? 0}
            change="Across all categories"
            changeType="neutral"
            icon={Users}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            title="Offers"
            value={stats?.offers.total ?? 0}
            change="Total received"
            changeType="neutral"
            icon={Package}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <StatCard
            title="AI Pipeline"
            value={`${(stats?.jobs.recent as Record<string, string>[])?.filter?.((j) => j.status === 'processing')?.length ?? 0} active`}
            change="6-agent orchestration"
            changeType="neutral"
            icon={Bot}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent RFQs */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recent RFQs</h3>
              <Link to="/rfqs" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {(stats?.rfqs.recent as Record<string, string>[])?.length ? (
                (stats?.rfqs.recent as Record<string, string>[]).slice(0, 5).map((rfq, i) => (
                  <div key={i} className="px-5 py-3 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{rfq.title || 'Untitled RFQ'}</p>
                      <p className="text-xs text-gray-500">{rfq.category || 'General'}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <StatusBadge status={rfq.status || 'draft'} />
                      <span className="text-xs text-gray-400">{rfq.urgency || ''}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-sm text-gray-500">
                  No RFQs yet. Create your first RFQ to get started.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & AI Status */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/rfqs?action=create"
                  className="flex items-center gap-3 px-4 py-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">Create New RFQ</span>
                </Link>
                <Link
                  to="/suppliers"
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">Browse Suppliers</span>
                </Link>
                <Link
                  to="/orchestration"
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bot className="w-5 h-5" />
                  <span className="text-sm font-medium">Launch AI Pipeline</span>
                </Link>
                <Link
                  to="/risk"
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">Risk Assessment</span>
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">AI Engine Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Parameter Engine</span>
                  </div>
                  <span className="text-xs font-medium text-green-600">3,247 params</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Agent Pipeline</span>
                  </div>
                  <span className="text-xs font-medium text-blue-600">6 agents</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Negotiation AI</span>
                  </div>
                  <span className="text-xs font-medium text-purple-600">IRL + PPO</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-gray-600">Risk Modules</span>
                  </div>
                  <span className="text-xs font-medium text-amber-600">35 modules</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600">Data Sources</span>
                  </div>
                  <span className="text-xs font-medium text-red-600">50+ APIs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
