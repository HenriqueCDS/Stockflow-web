import axios from 'axios'

const BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

export const TOKEN_KEY = 'homestock.token'
export const REFRESH_KEY = 'homestock.refreshToken'
export const USER_KEY = 'homestock.user'

// Normaliza LoginResponseDTO em { token, refreshToken, user }
const toSession = (body, fallbackEmail) => {
  const token = body?.accessToken
  if (!token) throw new Error('Resposta de login sem token de acesso.')
  return {
    token,
    refreshToken: body.refreshToken || null,
    user: { id: body.userId, email: body.email || fallbackEmail, name: body.name, role: body.role }
  }
}

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Renova o access token usando o refresh token (uma única chamada por vez)
let refreshing = null
const refreshSession = () => {
  const refreshToken = sessionStorage.getItem(REFRESH_KEY)
  if (!refreshToken) return Promise.reject(new Error('Sem refresh token'))
  if (!refreshing) {
    refreshing = axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
      .then(res => {
        const session = toSession(res.data?.data)
        sessionStorage.setItem(TOKEN_KEY, session.token)
        if (session.refreshToken) sessionStorage.setItem(REFRESH_KEY, session.refreshToken)
        return session.token
      })
      .finally(() => { refreshing = null })
  }
  return refreshing
}

const errorMessage = (err) => {
  const data = err.response?.data
  const details = data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).join('; ') : ''
  return details || data?.message || 'Erro ao conectar com o servidor. Verifique sua conexão.'
}

api.interceptors.response.use(
  res => {
    // Desembrulha o envelope ApiResponseDTO { success, message, data, errors, timestamp }
    const body = res.data
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) res.data = body.data
    return res
  },
  async err => {
    const config = err.config
    const isAuthCall = config?.url?.startsWith('/auth/')
    if (err.response?.status === 401 && !isAuthCall) {
      if (!config._retried) {
        config._retried = true
        try {
          const token = await refreshSession()
          config.headers.Authorization = `Bearer ${token}`
          return api(config)
        } catch { /* cai para encerrar a sessão */ }
      }
      // Sessão inválida: o AuthContext escuta este evento e encerra a sessão
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(new Error(errorMessage(err)))
  }
)

// Autenticação
export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    return toSession(res.data, email)
  },
  register: async (data) => {
    const res = await api.post('/auth/register', data)
    return toSession(res.data, data.email)
  }
}

// Produtos (listagem paginada: { content, page, size, totalElements, totalPages, first, last })
export const productApi = {
  getAll: (params = {}) => api.get('/products', { params: { size: 200, ...params } }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  deactivate: (id) => api.delete(`/products/${id}`)
}

// Movimentações de estoque
export const stockApi = {
  // type: ENTRY | EXIT | ADJUSTMENT | RETURN
  adjust: (data) => api.post('/stock-movements/adjust', data),
  getMovements: (params = {}) => api.get('/stock-movements', { params: { size: 200, ...params } }),
  getMovementsByProduct: (productId, params = {}) => api.get(`/stock-movements/product/${productId}`, { params })
}

// Notas fiscais (NFC-e)
export const invoiceApi = {
  getAll: (params = {}) => api.get('/invoices', { params: { size: 50, ...params } }),
  getById: (id) => api.get(`/invoices/${id}`),
  remove: (id) => api.delete(`/invoices/${id}`),
  processQrCode: (qrCode) => api.post('/nfce/process', null, { params: { qrCode } }),
  confirm: (id) => api.post(`/nfce/${id}/confirm`),
  reject: (id) => api.post(`/nfce/${id}/reject`)
}

// Empresa
export const companyApi = {
  get: () => api.get('/company'),
  update: (data) => api.put('/company', data)
}

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard')
}
