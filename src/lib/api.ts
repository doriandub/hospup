// Clean API client for Railway backend
const API_BASE_URL = 'https://web-production-93a0d.up.railway.app'

interface User {
  id: string
  name: string
  email: string
  plan: string
  videos_used: number
  videos_limit: number
  created_at: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  name: string
  email: string
  password: string
}

// Simple fetch wrapper with error handling
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, defaultOptions)
    
    // Handle auth errors
    if (response.status === 401) {
      // Redirect to login if not authenticated
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
        window.location.href = '/auth/login'
      }
      throw new Error('Not authenticated')
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}`)
    }
    
    return response.json()
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error.message)
    throw error
  }
}

// Authentication API
export const authAPI = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<User> => {
    return apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  // Register user
  register: async (userData: RegisterData): Promise<User> => {
    return apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  // Get current user
  getMe: async (): Promise<User> => {
    return apiRequest('/api/v1/auth/me')
  },

  // Check if authenticated
  check: async (): Promise<{ authenticated: boolean; user_id?: string }> => {
    return apiRequest('/api/v1/auth/check')
  },

  // Logout
  logout: async (): Promise<void> => {
    return apiRequest('/api/v1/auth/logout', {
      method: 'POST',
    })
  },
}

// Properties API
export const propertiesAPI = {
  getAll: async () => {
    return apiRequest('/api/v1/properties')
  },
  
  getById: async (id: string) => {
    return apiRequest(`/api/v1/properties/${id}`)
  },
  
  create: async (data: any) => {
    return apiRequest('/api/v1/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  update: async (id: string, data: any) => {
    return apiRequest(`/api/v1/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  
  delete: async (id: string) => {
    return apiRequest(`/api/v1/properties/${id}`, {
      method: 'DELETE',
    })
  },
}

// Videos API
export const videosAPI = {
  getAll: async (propertyId?: string, videoType?: string) => {
    const params = new URLSearchParams()
    if (propertyId) params.append('property_id', propertyId)
    if (videoType) params.append('video_type', videoType)
    
    const query = params.toString()
    return apiRequest(`/api/v1/videos${query ? '?' + query : ''}`)
  },
  
  getById: async (id: string) => {
    return apiRequest(`/api/v1/videos/${id}`)
  },
  
  generate: async (data: any) => {
    return apiRequest('/api/v1/videos/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  
  delete: async (id: string) => {
    return apiRequest(`/api/v1/videos/${id}`, {
      method: 'DELETE',
    })
  },
}

// Legacy exports for compatibility
export const api = { 
  get: (url: string) => apiRequest(url),
  post: (url: string, data: any) => apiRequest(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data: any) => apiRequest(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url: string) => apiRequest(url, { method: 'DELETE' }),
}

export const propertiesApi = propertiesAPI
export const videosApi = videosAPI
export const textApi = {
  getSuggestions: (propertyId?: string, category?: string, count?: number) => {
    const params = new URLSearchParams()
    if (propertyId) params.append('property_id', propertyId)
    if (category) params.append('category', category)
    if (count) params.append('count', count.toString())
    
    const query = params.toString()
    return apiRequest(`/api/v1/text/suggestions${query ? '?' + query : ''}`)
  },
  
  getCategories: () => apiRequest('/api/v1/text/categories'),
}

export { apiRequest }
export type { User, LoginCredentials, RegisterData }