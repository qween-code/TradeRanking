import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi } from '../services/api'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  company?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; full_name: string; role?: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }, [])

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        const res = await authApi.me()
        setUser(res.data.data || res.data)
      } catch {
        logout()
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [token, logout])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    const data = res.data.data || res.data
    const accessToken = data.access_token
    const userData = data.user

    setToken(accessToken)
    setUser(userData)
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const register = async (data: { email: string; password: string; full_name: string; role?: string }) => {
    const res = await authApi.register(data)
    const respData = res.data.data || res.data
    const accessToken = respData.access_token
    const userData = respData.user

    setToken(accessToken)
    setUser(userData)
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
