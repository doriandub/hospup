import axios, { AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

// HARDCODED RAILWAY URL - NO ENVIRONMENT VARIABLES  
const RAILWAY_URL = 'https://web-production-93a0d.up.railway.app'
console.log('🚀 FORCED API URL:', RAILWAY_URL)

export const API_URL = RAILWAY_URL

// Create axios instance with default config for cookie-based auth
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // IMPORTANT: This enables cookies
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid
      console.log('Authentication failed - redirecting to login')
      
      // Only redirect if we're in a browser environment and not already on login page
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (!currentPath.includes('/auth/')) {
          window.location.href = '/auth/login-safe'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Updated auth API endpoints using cookie authentication
export const authApi = {
  register: (userData: { name: string; email: string; password: string }) => {
    console.log('📝 REGISTER URL:', `${RAILWAY_URL}/api/v1/auth/register`)
    return api.post('/api/v1/auth/register', userData)
  },
  
  login: (credentials: { email: string; password: string }) => {
    console.log('🔑 LOGIN URL:', `${RAILWAY_URL}/api/v1/auth/login`)
    return api.post('/api/v1/auth/login', credentials)
  },
  
  logout: () => api.post('/api/v1/auth/logout'),
  
  logoutAll: () => api.post('/api/v1/auth/logout-all'),
  
  getProfile: () => api.get('/api/v1/auth/me'),
  
  checkAuth: () => api.get('/api/v1/auth/check'),
}

export const propertiesApi = {
  getAll: () => api.get('/api/v1/properties'),
  
  getById: (id: string) => api.get(`/api/v1/properties/${id}`),
  
  create: (data: any) => api.post('/api/v1/properties', data),
  
  update: (id: string, data: any) => api.put(`/api/v1/properties/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/v1/properties/${id}`),
}

export const videosApi = {
  getAll: (propertyId?: string, videoType?: string) => {
    const params: any = {}
    if (propertyId) params.property_id = propertyId
    if (videoType) params.video_type = videoType
    return api.get('/api/v1/videos', { params })
  },
  
  getById: (id: string) => api.get(`/api/v1/videos/${id}`),
  
  generate: (data: any) => api.post('/api/v1/videos/generate', data),
  
  delete: (id: string) => api.delete(`/api/v1/videos/${id}`),
}

export const textApi = {
  getSuggestions: (propertyId?: string, category?: string, count?: number) => {
    const params: any = {}
    if (propertyId) params.property_id = propertyId
    if (category) params.category = category
    if (count) params.count = count
    return api.get('/api/v1/text/suggestions', { params })
  },
  
  getCategories: () => api.get('/api/v1/text/categories'),
}

export default api