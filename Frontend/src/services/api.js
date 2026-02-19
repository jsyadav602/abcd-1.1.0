import axios from 'axios'

function normalizeApiBaseUrl(raw) {
  const fallback = 'http://localhost:4000/api/v1'
  const base = (raw || '').trim()
  if (!base) return fallback

  // Normalize trailing slashes
  const trimmed = base.replace(/\/+$/, '')

  // If user provided just the origin (e.g. http://localhost:4000), append the API base path.
  if (!trimmed.includes('/api')) return `${trimmed}/api/v1`

  // Backwards compatibility: older config used ".../api"
  if (trimmed.endsWith('/api')) return `${trimmed}/v1`

  return trimmed
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

// Create axios instance
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true  // Important: Send cookies with requests (for refreshToken cookie)
})

// Request interceptor - Add token to every request
API.interceptors.request.use(
  config => {
    // Get accessToken from sessionStorage (more secure than localStorage)
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle common errors
API.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const url = error.config?.url || ''

    if (status === 401) {
      // Skip global redirect for auth endpoints like login/refresh/change-password
      const isAuthEndpoint =
        url.startsWith('/auth/login') ||
        url.startsWith('/auth/refresh') ||
        url.startsWith('/auth/change-password')

      if (!isAuthEndpoint) {
        // Token expired or invalid - clear and redirect to login
        localStorage.removeItem('user')
        localStorage.removeItem('permissions')
        sessionStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default API

// Auth API endpoints
export const authAPI = {
  login: (loginId, password) =>
    API.post('/auth/login', { loginId, password }),
  register: (userData) =>
    API.post('/auth/register', userData),
  logout: () =>
    API.post('/auth/logout'),
  getProfile: () =>
    API.get('/auth/profile'),
  refreshToken: () =>
    API.post('/auth/refresh'),
  changePassword: (oldPassword, newPassword, confirmPassword) =>
    API.post('/auth/change-password', { oldPassword, newPassword, confirmPassword })
}

// User API endpoints
export const userAPI = {
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  create: (userData) => API.post('/users', userData),
  update: (id, userData) => API.put(`/users/${id}`, userData),
  delete: (id) => API.delete(`/users/${id}`)
}

// Organization API endpoints
export const organizationAPI = {
  getAll: () => API.get('/organizations'),
  getById: (id) => API.get(`/organizations/${id}`),
  create: (data) => API.post('/organizations', data),
  update: (id, data) => API.put(`/organizations/${id}`, data),
  delete: (id) => API.delete(`/organizations/${id}`)
}

// Branch API endpoints
export const branchAPI = {
  getAll: () => API.get('/branches'),
  getById: (id) => API.get(`/branches/${id}`),
  create: (data) => API.post('/branches', data),
  update: (id, data) => API.put(`/branches/${id}`, data),
  delete: (id) => API.delete(`/branches/${id}`)
}

// Role API endpoints
export const roleAPI = {
  getAll: () => API.get('/roles'),
  getById: (id) => API.get(`/roles/${id}`),
  create: (data) => API.post('/roles', data),
  update: (id, data) => API.put(`/roles/${id}`, data),
  delete: (id) => API.delete(`/roles/${id}`)
}
