import { useState } from 'react'
import TopBar from '../components/TopBar'
import {
  ShieldCheck,
  Globe,
  Cloud,
  DollarSign,
  Truck,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Info,
  Zap,
} from 'lucide-react'

// 35 Risk modules organized in 6 categories
const riskModules = [
  {
    category: 'Geopolitical & Security',
    color: 'red',
    icon: Globe,
    modules: [
      { name: 'Country Stability Index', params: 24, score: 72, trend: 'stable' },
      { name: 'Trade Lane Security', params: 40, score: 65, trend: 'down' },
      { name: 'Sanctions & Embargo', params: 35, score: 88, trend: 'up' },
      { name: 'Terrorism Risk Index', params: 28, score: 78, trend: 'stable' },
      { name: 'Diplomatic Relations', params: 30, score: 70, trend: 'down' },
      { name: 'Port Security Level', params: 15, score: 82, trend: 'up' },
    ],
  },
  {
    category: 'Weather & Climate',
    color: 'blue',
    icon: Cloud,
    modules: [
      { name: 'Port Weather Conditions', params: 20, score: 75, trend: 'stable' },
      { name: 'Route Weather Forecast', params: 29, score: 68, trend: 'down' },
      { name: 'Seasonal Risk Patterns', params: 25, score: 80, trend: 'up' },
      { name: 'Climate Change Impact', params: 22, score: 62, trend: 'down' },
      { name: 'Product Sensitivity', params: 18, score: 85, trend: 'stable' },
    ],
  },
  {
    category: 'Financial Health',
    color: 'green',
    icon: DollarSign,
    modules: [
      { name: 'Credit & Rating Analysis', params: 35, score: 79, trend: 'up' },
      { name: 'Bankruptcy Prediction', params: 28, score: 91, trend: 'stable' },
      { name: 'Cash Flow Health', params: 32, score: 74, trend: 'down' },
      { name: 'FX & Currency Risk', params: 25, score: 68, trend: 'down' },
      { name: 'Payment Behavior', params: 22, score: 83, trend: 'up' },
    ],
  },
  {
    category: 'Supply Chain & Logistics',
    color: 'purple',
    icon: Truck,
    modules: [
      { name: 'Delivery Reliability', params: 30, score: 76, trend: 'up' },
      { name: 'Lead Time Analysis', params: 25, score: 72, trend: 'stable' },
      { name: 'Capacity Utilization', params: 20, score: 65, trend: 'down' },
      { name: 'Transport Mode Risk', params: 28, score: 80, trend: 'stable' },
      { name: 'Inventory Buffer Score', params: 18, score: 70, trend: 'up' },
      { name: 'Customs Processing', params: 46, score: 77, trend: 'stable' },
    ],
  },
  {
    category: 'Quality & Compliance',
    color: 'amber',
    icon: Award,
    modules: [
      { name: 'Product Quality Score', params: 45, score: 84, trend: 'up' },
      { name: 'Certification Validity', params: 36, score: 90, trend: 'stable' },
      { name: 'Regulatory Compliance', params: 42, score: 86, trend: 'up' },
      { name: 'ESG & Sustainability', params: 38, score: 71, trend: 'up' },
      { name: 'Audit Performance', params: 20, score: 78, trend: 'stable' },
    ],
  },
  {
    category: 'Market Intelligence',
    color: 'cyan',
    icon: TrendingUp,
    modules: [
      { name: 'Commodity Price Index', params: 20, score: 73, trend: 'down' },
      { name: 'Supply-Demand Balance', params: 18, score: 69, trend: 'stable' },
      { name: 'Price Forecast Model', params: 22, score: 76, trend: 'up' },
    ],
  },
]

const colorMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', light: 'bg-red-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', light: 'bg-blue-100' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', light: 'bg-green-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', light: 'bg-purple-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', light: 'bg-cyan-100' },
}

export default function RiskCenterPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const totalParams = riskModules.reduce(
    (sum, cat) => sum + cat.modules.reduce((s, m) => s + m.params, 0),
    0
  )
  const totalModules = riskModules.reduce((sum, cat) => sum + cat.modules.length, 0)
  const avgScore = Math.round(
    riskModules.reduce(
      (sum, cat) => sum + cat.modules.reduce((s, m) => s + m.score, 0),
      0
    ) / totalModules
  )

  return (
    <div>
      <TopBar title="Risk Center" subtitle="35-module parametric risk analysis engine" />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{totalModules}</p>
            <p className="text-sm text-gray-500">Risk Modules</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{totalParams.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Base Parameters</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{avgScore}</p>
            <p className="text-sm text-gray-500">Avg Risk Score</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-primary-600">50+</p>
            <p className="text-sm text-gray-500">Data Sources</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">God Mode Parameter Engine</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Each base parameter expands across entities (suppliers x products x routes x countries),
              creating billions of effective decision points. Data feeds from ACLED, GDELT, NOAA,
              D&B, Moody's, WTO, and 44+ other external APIs.
            </p>
          </div>
        </div>

        {/* Risk Category Cards */}
        <div className="space-y-4">
          {riskModules.map((cat) => {
            const colors = colorMap[cat.color]
            const isExpanded = expandedCategory === cat.category
            const catAvg = Math.round(cat.modules.reduce((s, m) => s + m.score, 0) / cat.modules.length)
            const catParams = cat.modules.reduce((s, m) => s + m.params, 0)

            return (
              <div key={cat.category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2.5 rounded-lg ${colors.light}`}>
                    <cat.icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-semibold text-gray-900">{cat.category}</h3>
                    <p className="text-xs text-gray-500">{cat.modules.length} modules &middot; {catParams} parameters</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{catAvg}</p>
                      <p className="text-xs text-gray-500">avg score</p>
                    </div>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          catAvg >= 80 ? 'bg-green-500' : catAvg >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${catAvg}%` }}
                      />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                      {cat.modules.map((mod) => (
                        <div key={mod.name} className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium ${colors.text}`}>{mod.name}</span>
                            {mod.trend === 'up' ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : mod.trend === 'down' ? (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-end gap-2 mb-2">
                            <span className="text-2xl font-bold text-gray-900">{mod.score}</span>
                            <span className="text-xs text-gray-500 mb-1">/100</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{mod.params} parameters</span>
                            <div className="w-12 h-1.5 bg-white/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  mod.score >= 80 ? 'bg-green-500' : mod.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${mod.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Alert Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Active Risk Alerts
          </h3>
          <div className="space-y-3">
            {[
              { severity: 'high', msg: 'Red Sea shipping disruptions affecting 3 active trade lanes', module: 'Trade Lane Security' },
              { severity: 'medium', msg: 'CNY/USD volatility exceeding 30-day moving average by 2.1x', module: 'FX & Currency Risk' },
              { severity: 'medium', msg: 'New EU CBAM regulations effective Q1 2026 for steel imports', module: 'Regulatory Compliance' },
              { severity: 'low', msg: 'Monsoon season approaching: potential delays on India-EU routes', module: 'Route Weather Forecast' },
              { severity: 'high', msg: 'Supplier FinScore drop detected: ChemPro GmbH (-12 points in 30d)', module: 'Credit & Rating Analysis' },
            ].map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.severity === 'high' ? 'bg-red-50' : alert.severity === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                  }`}
                />
                <div className="flex-1">
                  <p className={`text-sm ${
                    alert.severity === 'high' ? 'text-red-800' : alert.severity === 'medium' ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {alert.msg}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Module: {alert.module}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
