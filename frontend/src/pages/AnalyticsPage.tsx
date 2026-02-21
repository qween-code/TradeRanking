import { useState } from 'react'
import TopBar from '../components/TopBar'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Globe,
  ShieldCheck,
  Clock,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// Analytics page with mock data for visualization
// In production, these would come from the analytics API

const mockMetrics = {
  costSavings: { value: 12.4, change: 2.3, trend: 'up' as const },
  avgResponseTime: { value: 4.2, change: -0.8, trend: 'down' as const },
  supplierScore: { value: 78, change: 5, trend: 'up' as const },
  riskIndex: { value: 23, change: -3, trend: 'down' as const },
}

const categoryBreakdown = [
  { name: 'Metals & Alloys', rfqs: 24, spend: 2_400_000, suppliers: 15 },
  { name: 'Electronics', rfqs: 18, spend: 1_800_000, suppliers: 12 },
  { name: 'Chemicals', rfqs: 12, spend: 950_000, suppliers: 8 },
  { name: 'Textiles', rfqs: 8, spend: 420_000, suppliers: 6 },
  { name: 'Machinery', rfqs: 6, spend: 3_200_000, suppliers: 4 },
]

const topSuppliers = [
  { name: 'SteelTech Co.', country: 'China', score: 92, orders: 45, savings: 8.2 },
  { name: 'MicroElec Ltd.', country: 'Taiwan', score: 89, orders: 32, savings: 11.5 },
  { name: 'ChemPro GmbH', country: 'Germany', score: 87, orders: 28, savings: 6.8 },
  { name: 'TextileMax', country: 'Turkey', score: 84, orders: 22, savings: 9.1 },
  { name: 'HeavyMach Inc.', country: 'Japan', score: 81, orders: 15, savings: 7.4 },
]

const riskDistribution = [
  { category: 'Financial Health', low: 45, medium: 30, high: 25 },
  { category: 'Geopolitical', low: 55, medium: 25, high: 20 },
  { category: 'Quality', low: 60, medium: 28, high: 12 },
  { category: 'Delivery', low: 50, medium: 35, high: 15 },
  { category: 'Compliance', low: 65, medium: 20, high: 15 },
]

function MetricCard({
  title,
  value,
  unit,
  change,
  trend,
  icon: Icon,
}: {
  title: string
  value: number
  unit: string
  change: number
  trend: 'up' | 'down'
  icon: typeof TrendingUp
}) {
  const isPositive = (trend === 'up' && change > 0) || (trend === 'down' && change < 0)
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{title}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-500 mb-1">{unit}</span>
      </div>
      <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {Math.abs(change)}{unit === '%' ? 'pp' : unit} vs last month
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')

  return (
    <div>
      <TopBar title="Analytics" subtitle="Procurement intelligence and performance metrics" />

      <div className="p-6 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' },
            { key: '1y', label: '1 Year' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                period === p.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Cost Savings"
            value={mockMetrics.costSavings.value}
            unit="%"
            change={mockMetrics.costSavings.change}
            trend="up"
            icon={DollarSign}
          />
          <MetricCard
            title="Avg Response Time"
            value={mockMetrics.avgResponseTime.value}
            unit="hrs"
            change={mockMetrics.avgResponseTime.change}
            trend="down"
            icon={Clock}
          />
          <MetricCard
            title="Supplier Quality Score"
            value={mockMetrics.supplierScore.value}
            unit="/100"
            change={mockMetrics.supplierScore.change}
            trend="up"
            icon={ShieldCheck}
          />
          <MetricCard
            title="Risk Index"
            value={mockMetrics.riskIndex.value}
            unit="/100"
            change={mockMetrics.riskIndex.change}
            trend="down"
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Category Breakdown</h3>
            </div>
            <div className="p-5">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left pb-3 font-medium">Category</th>
                    <th className="text-right pb-3 font-medium">RFQs</th>
                    <th className="text-right pb-3 font-medium">Spend</th>
                    <th className="text-right pb-3 font-medium">Suppliers</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((cat) => (
                    <tr key={cat.name} className="border-b border-gray-50">
                      <td className="py-3">
                        <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm text-gray-700">{cat.rfqs}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm text-gray-700">${(cat.spend / 1000).toFixed(0)}K</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-sm text-gray-700">{cat.suppliers}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Top Suppliers</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {topSuppliers.map((supplier, i) => (
                <div key={supplier.name} className="px-5 py-3 flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{supplier.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Globe className="w-3 h-3" />{supplier.country} &middot; {supplier.orders} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{supplier.score}</p>
                    <p className="text-xs text-green-600">-{supplier.savings}% cost</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Risk Distribution by Category</h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {riskDistribution.map((risk) => (
                <div key={risk.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">{risk.category}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-600">{risk.low}% Low</span>
                      <span className="text-yellow-600">{risk.medium}% Med</span>
                      <span className="text-red-600">{risk.high}% High</span>
                    </div>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-green-400" style={{ width: `${risk.low}%` }} />
                    <div className="bg-yellow-400" style={{ width: `${risk.medium}%` }} />
                    <div className="bg-red-400" style={{ width: `${risk.high}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">AI Procurement Insights</h3>
              <ul className="space-y-2 text-sm text-primary-100">
                <li>Metals procurement shows 8.2% cost optimization opportunity based on market trends</li>
                <li>3 suppliers in the electronics category have deteriorating financial health scores</li>
                <li>Geopolitical risk in Southeast Asian trade lanes increased 12% this quarter</li>
                <li>Lead times for chemical products have decreased 15% - opportunity for inventory reduction</li>
                <li>Recommending diversification: 67% of machinery spend concentrated with 2 suppliers</li>
              </ul>
              <p className="mt-3 text-xs text-primary-200">
                Based on analysis of 3,247 parameters across 35 risk modules
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
