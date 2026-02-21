import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  ShieldCheck,
  Bot,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rfqs', icon: FileText, label: 'RFQs' },
  { to: '/suppliers', icon: Users, label: 'Suppliers' },
  { to: '/offers', icon: Package, label: 'Offers' },
  { to: '/orchestration', icon: Bot, label: 'AI Pipeline' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/risk', icon: ShieldCheck, label: 'Risk Center' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">Agentik</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">B2B Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-primary-700 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role || 'buyer'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <NavLink
            to="/settings"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </NavLink>
          <button
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
