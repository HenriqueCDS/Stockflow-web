import axios from 'axios'

const SESSION_KEY = 'stockflow_session'
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/refresh']

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function setSession(loginResponseDTO) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(loginResponseDTO))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getStoredUser() {
  const s = getSession()
  return s ? { userId: s.userId, email: s.email, name: s.name, role: s.role } : null
}

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

// Separate client for token refresh so it never triggers the response interceptor's refresh logic
const refreshClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

api.interceptors.request.use(config => {
  const token = getSession()?.accessToken
  if (token && !PUBLIC_PATHS.some(p => config.url.includes(p))) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshQueue = []

function forceLogout() {
  clearSession()
  window.dispatchEvent(new Event('auth:logout'))
}

api.interceptors.response.use(
  res => {
    if (res.data && typeof res.data === 'object' && 'success' in res.data) {
      res.data = res.data.data
    }
    return res
  },
  async (error) => {
    const original = error.config
    const isAuthPath = original && PUBLIC_PATHS.some(p => original.url.includes(p))

    if (error.response?.status === 401 && original && !original._retry && !isAuthPath) {
      const refreshToken = getSession()?.refreshToken
      if (!refreshToken) {
        forceLogout()
        return Promise.reject(new Error('Sessão expirada. Faça login novamente.'))
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, original })
        })
      }

      original._retry = true
      isRefreshing = true
      try {
        const { data } = await refreshClient.post('/auth/refresh', { refreshToken })
        setSession(data.data)
        isRefreshing = false
        refreshQueue.forEach(({ resolve, original: o }) => {
          o.headers.Authorization = `Bearer ${data.data.accessToken}`
          resolve(api(o))
        })
        refreshQueue = []
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch (refreshErr) {
        isRefreshing = false
        refreshQueue.forEach(({ reject }) => reject(refreshErr))
        refreshQueue = []
        forceLogout()
        return Promise.reject(new Error('Sessão expirada. Faça login novamente.'))
      }
    }

    const msg = error.response?.data?.message || 'Erro ao conectar com o servidor. Verifique sua conexão.'
    return Promise.reject(new Error(msg))
  }
)

// Autenticação
export const authApi = {
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data)
}

// Empresa
export const companyApi = {
  get: () => api.get('/company').then(r => r.data),
  update: (data) => api.put('/company', data).then(r => r.data)
}

// Produtos
export const productApi = {
  list: (params) => api.get('/products', { params }).then(r => r.data),
  getById: (id) => api.get(`/products/${id}`).then(r => r.data),
  create: (data) => api.post('/products', data).then(r => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then(r => r.data),
  deactivate: (id) => api.delete(`/products/${id}`)
}

// Movimentações de estoque
export const stockApi = {
  adjust: (data) => api.post('/stock-movements/adjust', data).then(r => r.data),
  list: (params) => api.get('/stock-movements', { params }).then(r => r.data),
  listByProduct: (productId, params) => api.get(`/stock-movements/product/${productId}`, { params }).then(r => r.data)
}

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard').then(r => r.data)
}

export default api
