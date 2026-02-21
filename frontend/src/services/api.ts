import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request interceptor - attach JWT token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; full_name: string; role?: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ─── RFQs ────────────────────────────────────────────────────────────
export const rfqApi = {
  list: (params?: { status?: string; skip?: number; limit?: number }) =>
    api.get('/rfqs/', { params }),
  get: (id: string) => api.get(`/rfqs/${id}`),
  create: (data: Record<string, unknown>) => api.post('/rfqs/', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/rfqs/${id}`, data),
  delete: (id: string) => api.delete(`/rfqs/${id}`),
  templates: () => api.get('/rfqs/templates/list'),
}

// ─── Suppliers ───────────────────────────────────────────────────────
export const supplierApi = {
  list: (params?: { search?: string; country?: string; category?: string; skip?: number; limit?: number }) =>
    api.get('/suppliers/', { params }),
  get: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/suppliers/', data),
  risk: (id: string) => api.get(`/suppliers/${id}/risk`),
}

// ─── Offers ──────────────────────────────────────────────────────────
export const offerApi = {
  list: (params?: { skip?: number; limit?: number }) =>
    api.get('/offers/', { params }),
  get: (id: string) => api.get(`/offers/${id}`),
  byRfq: (rfqId: string) => api.get(`/offers/rfq/${rfqId}`),
  create: (data: Record<string, unknown>) => api.post('/offers/', data),
  accept: (id: string) => api.post(`/offers/${id}/accept`),
  reject: (id: string) => api.post(`/offers/${id}/reject`),
}

// ─── Orchestration ───────────────────────────────────────────────────
export const orchestrationApi = {
  start: (data: { job_type: string; rfq_id?: string; supplier_id?: string; parameters?: Record<string, unknown> }) =>
    api.post('/orchestration/start', data),
  status: (jobId: string) => api.get(`/orchestration/status/${jobId}`),
  recent: () => api.get('/orchestration/recent'),
  history: (params?: { skip?: number; limit?: number }) =>
    api.get('/orchestration/history', { params }),
  cancel: (jobId: string) => api.delete(`/orchestration/cancel/${jobId}`),
}

// ─── Catalog ─────────────────────────────────────────────────────────
export const catalogApi = {
  list: (params?: { category?: string; search?: string; skip?: number; limit?: number }) =>
    api.get('/catalog/', { params }),
  get: (id: string) => api.get(`/catalog/${id}`),
  create: (data: Record<string, unknown>) => api.post('/catalog/', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/catalog/${id}`, data),
  delete: (id: string) => api.delete(`/catalog/${id}`),
}

// ─── Health ──────────────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get('/health'),
}

export default api
