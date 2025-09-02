import axios, { AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

// Centralized API URL configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-93a0d.up.railway.app'

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// API endpoints - TEMPORARY hardcoded Railway URLs for debugging
const RAILWAY_URL = 'https://web-production-93a0d.up.railway.app'

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    axios.post(`${RAILWAY_URL}/api/v1/auth/login`, credentials),
  
  register: (userData: { name: string; email: string; password: string }) =>
    axios.post(`${RAILWAY_URL}/api/v1/auth/register`, userData),
  
  getProfile: () =>
    api.get('/api/v1/auth/me'),
}

export const propertiesApi = {
  getAll: () =>
    api.get('/api/v1/properties'),
  
  getById: (id: string) =>
    api.get(`/api/v1/properties/${id}`),
  
  create: (data: any) =>
    api.post('/api/v1/properties', data),
  
  update: (id: string, data: any) =>
    api.put(`/api/v1/properties/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/api/v1/properties/${id}`),
}

export const videosApi = {
  getAll: (propertyId?: string, videoType?: string) => {
    const params: any = {}
    if (propertyId) params.property_id = propertyId
    if (videoType) params.video_type = videoType
    return api.get('/api/v1/videos', { params })
  },
  
  getById: (id: string) =>
    api.get(`/api/v1/videos/${id}`),
  
  generate: (data: any) =>
    api.post('/api/v1/videos/generate', data),
  
  delete: (id: string) =>
    api.delete(`/api/v1/videos/${id}`),
}

export const textApi = {
  getSuggestions: (propertyId?: string, category?: string, count?: number) => {
    const params: any = {}
    if (propertyId) params.property_id = propertyId
    if (category) params.category = category
    if (count) params.count = count
    return api.get('/api/v1/text/suggestions', { params })
  },
  
  getCategories: () =>
    api.get('/api/v1/text/categories'),
}

export default api