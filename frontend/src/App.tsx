import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import LoadingSpinner from './components/LoadingSpinner'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RFQsPage from './pages/RFQsPage'
import SuppliersPage from './pages/SuppliersPage'
import OffersPage from './pages/OffersPage'
import OrchestrationPage from './pages/OrchestrationPage'
import AnalyticsPage from './pages/AnalyticsPage'
import RiskCenterPage from './pages/RiskCenterPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading Agentik Platform..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64">
        <Outlet />
      </main>
    </div>
  )
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/rfqs" element={<RFQsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/orchestration" element={<OrchestrationPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/risk" element={<RiskCenterPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
