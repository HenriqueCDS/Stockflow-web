import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
})

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || 'Erro ao conectar com o servidor. Verifique sua conexão.'
    return Promise.reject(new Error(msg))
  }
)

// Produtos
export const productApi = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  search: (name) => api.get(`/products/search?name=${name}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  deactivate: (id) => api.delete(`/products/${id}`)
}

// Movimentações
export const stockApi = {
  registerEntry: (data) => api.post('/stock/entries', data),
  registerExit: (data) => api.post('/stock/exits', data),
  getMovementsByProduct: (productId) => api.get(`/stock/reports/movements/product/${productId}`),
  getMovementsByDateRange: (start, end) => api.get(`/stock/reports/movements?startDate=${start}&endDate=${end}`),
  getMovementsByType: (type) => api.get(`/stock/reports/movements/type/${type}`)
}

// Relatórios
export const reportApi = {
  getGeneralReport: () => api.get('/stock/reports/general')
}
