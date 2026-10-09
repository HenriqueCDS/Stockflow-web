import axios from 'axios'

const BASE_URL = '/api/v1'
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
  return s ? { id: s.userId, email: s.email, name: s.name, role: s.role } : null
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

// Cliente separado para o refresh, para nunca disparar o próprio interceptor de refresh
const refreshClient = axios.create({
  baseURL: BASE_URL,
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

function forceLogout() {
  clearSession()
  window.dispatchEvent(new Event('auth:logout'))
}

const errorMessage = (err) => {
  const data = err.response?.data
  const details = data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).join('; ') : ''
  return details || data?.message || 'Erro ao conectar com o servidor. Verifique sua conexão.'
}

let isRefreshing = false
let refreshQueue = []

api.interceptors.response.use(
  res => {
    // Desembrulha o envelope ApiResponseDTO { success, message, data, errors, timestamp }
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

    return Promise.reject(new Error(errorMessage(error)))
  }
)

// Autenticação
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  join: (data) => api.post('/auth/join', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data)
}

// Perfil do usuário autenticado
export const userApi = {
  getProfile: () => api.get('/users/me').then(r => r.data),
  updateProfile: (data) => api.put('/users/me', data).then(r => r.data)
}

// Casa (rota /company no backend, sem CNPJ) + membros e código de convite
export const houseApi = {
  get: () => api.get('/company').then(r => r.data),
  update: (data) => api.put('/company', data).then(r => r.data),
  members: () => api.get('/company/members').then(r => r.data),
  removeMember: (userId) => api.delete(`/company/members/${userId}`).then(r => r.data),
  rotateInviteCode: () => api.post('/company/invite-code/rotate').then(r => r.data)
}

// Produtos (listagem paginada: { content, page, size, totalElements, totalPages, first, last })
export const productApi = {
  list: (params) => api.get('/products', { params }).then(r => r.data),
  getById: (id) => api.get(`/products/${id}`).then(r => r.data),
  create: (data) => api.post('/products', data).then(r => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then(r => r.data),
  deactivate: (id) => api.delete(`/products/${id}`).then(r => r.data),
  use: (id, quantity = 1) => api.post(`/products/${id}/use`, null, { params: { quantity } }).then(r => r.data),
  discard: (id, quantity = 1) => api.post(`/products/${id}/discard`, null, { params: { quantity } }).then(r => r.data)
}

// Movimentações de estoque (type: ENTRY | USED | DISCARDED | EXIT | ADJUSTMENT | RETURN)
export const stockApi = {
  adjust: (data) => api.post('/stock-movements/adjust', data).then(r => r.data),
  list: (params) => api.get('/stock-movements', { params }).then(r => r.data),
  listByProduct: (productId, params) => api.get(`/stock-movements/product/${productId}`, { params }).then(r => r.data)
}

// Notas fiscais (NFC-e)
export const invoiceApi = {
  list: (params) => api.get('/invoices', { params }).then(r => r.data),
  getById: (id) => api.get(`/invoices/${id}`).then(r => r.data),
  remove: (id) => api.delete(`/invoices/${id}`).then(r => r.data),
  processQrCode: (qrCode) => api.post('/nfce/process', { qrCode }).then(r => r.data),
  processImage: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/nfce/process/image', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  confirm: (id) => api.post(`/nfce/${id}/confirm`).then(r => r.data),
  reject: (id) => api.post(`/nfce/${id}/reject`).then(r => r.data),
  reviewItem: (invoiceId, itemId, data) => api.patch(`/nfce/${invoiceId}/items/${itemId}`, data).then(r => r.data)
}

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard').then(r => r.data)
}

// Lista de compras compartilhada
export const shoppingListApi = {
  list: () => api.get('/shopping-list').then(r => r.data),
  create: (data) => api.post('/shopping-list', data).then(r => r.data),
  check: (id) => api.post(`/shopping-list/${id}/check`).then(r => r.data),
  // Depende do backend expor o endpoint de desfazer
  uncheck: (id) => api.post(`/shopping-list/${id}/uncheck`).then(r => r.data),
  remove: (id) => api.delete(`/shopping-list/${id}`).then(r => r.data)
}

export default api
