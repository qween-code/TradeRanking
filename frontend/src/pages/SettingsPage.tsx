import { useState } from 'react'
import TopBar from '../components/TopBar'
import { useAuth } from '../contexts/AuthContext'
import {
  User,
  Bell,
  Shield,
  Globe,
  Database,
  Bot,
  Save,
  CheckCircle,
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    company: user?.company || '',
    role: user?.role || 'buyer',
  })

  const [notifications, setNotifications] = useState({
    email_rfq_updates: true,
    email_offer_received: true,
    email_risk_alerts: true,
    email_pipeline_complete: true,
    push_enabled: false,
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'api', label: 'API & Integrations', icon: Database },
    { key: 'ai', label: 'AI Settings', icon: Bot },
  ]

  return (
    <div>
      <TopBar title="Settings" subtitle="Manage your account and platform preferences" />

      <div className="p-6">
        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={profile.email} disabled
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input type="text" value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input type="text" value={profile.role} disabled
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 capitalize" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {[
                    { key: 'email_rfq_updates' as const, label: 'RFQ Status Updates', desc: 'Get notified when RFQ status changes' },
                    { key: 'email_offer_received' as const, label: 'New Offers', desc: 'Receive alerts for new supplier offers' },
                    { key: 'email_risk_alerts' as const, label: 'Risk Alerts', desc: 'Critical risk score changes and alerts' },
                    { key: 'email_pipeline_complete' as const, label: 'Pipeline Completion', desc: 'AI pipeline job completion notifications' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                        className={`w-11 h-6 rounded-full transition-colors ${
                          notifications[item.key] ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Engine Configuration</h3>
                <div className="space-y-5">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Active Configuration</p>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-xs text-blue-700">
                      <div>Parameters: 3,247</div>
                      <div>Risk Modules: 35</div>
                      <div>Agent Pipeline: 6 agents</div>
                      <div>Negotiation: IRL + PPO</div>
                      <div>Data Sources: 50+ APIs</div>
                      <div>Update Freq: Real-time</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Sensitivity</label>
                    <select className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                      <option value="conservative">Conservative (High sensitivity)</option>
                      <option value="balanced" selected>Balanced</option>
                      <option value="aggressive">Aggressive (Low sensitivity)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Negotiation Strategy</label>
                    <select className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                      <option value="cost_focused">Cost-Focused</option>
                      <option value="balanced" selected>Balanced</option>
                      <option value="quality_focused">Quality-Focused</option>
                      <option value="relationship">Relationship-Preserving</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auto-reject threshold</label>
                    <input type="number" defaultValue={30} min={0} max={100}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                    <p className="text-xs text-gray-500 mt-1">Offers scoring below this threshold are auto-rejected</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Security</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input type="password" placeholder="Enter current password"
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input type="password" placeholder="Enter new password"
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input type="password" placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">API & Integrations</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">API Endpoint</p>
                    <code className="text-xs text-gray-600 mt-1 block">{window.location.origin}/api</code>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Connected Data Sources</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {['ACLED', 'GDELT', 'NOAA', 'D&B', "Moody's", 'WTO', 'UNCTAD', 'IMF', 'World Bank'].map((src) => (
                        <span key={src} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center gap-1">
                          <Globe className="w-3 h-3" />{src}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" /> Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
