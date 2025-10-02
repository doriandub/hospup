import { User } from '@/types/user'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-b52f.up.railway.app'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    // Get token from localStorage - primary method for cloud deployment
    const storedToken = this.getStoredToken()

    // 🔍 DEBUG: Log request details for Safari troubleshooting
    console.log('🔍 API Request Debug:', {
      url,
      endpoint,
      method: options.method || 'GET',
      hasToken: !!storedToken,
      tokenPreview: storedToken ? `${storedToken.substring(0, 15)}...` : 'none',
      timestamp: new Date().toISOString()
    })

    const config: RequestInit = {
      headers: {
        // Don't set Content-Type for FormData - let browser handle it
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        // Authorization header is primary method for cloud (Vercel ↔ Railway)
        ...(storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {}),
        ...options.headers,
      },
      credentials: 'include', // Keep for compatibility but Authorization is primary
      ...options,
    }

    try {
      const response = await fetch(url, config)

      console.log('✅ Fetch succeeded:', {
        status: response.status,
        statusText: response.statusText,
        url,
        endpoint
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        console.error('❌ HTTP Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url,
          endpoint
        })

        // Handle detailed error messages properly
        let errorMessage = `HTTP error! status: ${response.status}`
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) =>
              typeof err === 'object' ? JSON.stringify(err) : err
            ).join(', ')
          } else {
            errorMessage = errorData.detail
          }
        } else if (errorData.message) {
          errorMessage = errorData.message
        }

        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Fetch Failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        url,
        endpoint,
        hasToken: !!storedToken,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  // Auth methods
  async register(email: string, password: string) {
    const result = await this.request<any>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    // Store token for mobile compatibility
    if (result.access_token && typeof window !== 'undefined') {
      localStorage.setItem('access_token', result.access_token)
    }
    
    return result
  }

  async login(email: string, password: string) {
    const result = await this.request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    // Store token for mobile compatibility
    if (result.access_token && typeof window !== 'undefined') {
      localStorage.setItem('access_token', result.access_token)
    }
    
    return result
  }

  async logout() {
    const result = await this.request('/api/v1/auth/logout', {
      method: 'POST',
    })
    
    // Clear stored token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
    }
    
    return result
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/v1/auth/me')
  }

  async refreshToken() {
    const result = await this.request<any>('/api/v1/auth/refresh', {
      method: 'POST',
    })
    
    // Store new token for mobile compatibility
    if (result.access_token && typeof window !== 'undefined') {
      localStorage.setItem('access_token', result.access_token)
    }
    
    return result
  }

  // Property methods
  async getProperties() {
    return this.request('/api/v1/properties/', { method: 'GET' })
  }

  async getProperty(id: number) {
    return this.request(`/api/v1/properties/${id}`, { method: 'GET' })
  }

  async createProperty(propertyData: any) {
    return this.request('/api/v1/properties/', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    })
  }

  async updateProperty(id: number, propertyData: any) {
    return this.request(`/api/v1/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    })
  }

  async deleteProperty(id: number) {
    return this.request(`/api/v1/properties/${id}`, { method: 'DELETE' })
  }

  // Generated Videos API (for AI-generated video results)
  async getGeneratedVideos(propertyId?: number) {
    let endpoint = '/api/v1/videos/'
    if (propertyId) {
      endpoint += `?property_id=${propertyId}`
    }
    return this.request<any>(endpoint, { method: 'GET' })
  }

  async getGeneratedVideo(videoId: string): Promise<any> {
    return this.request<any>(`/api/v1/videos/${videoId}`, { method: 'GET' })
  }

  async deleteGeneratedVideo(videoId: string) {
    return this.request(`/api/v1/videos/${videoId}`, { method: 'DELETE' })
  }

  async createGeneratedVideo(videoData: any) {
    return this.request('/api/v1/videos/', {
      method: 'POST',
      body: JSON.stringify(videoData)
    })
  }

  // Quota methods
  async getUserQuota() {
    return this.request<any>('/api/v1/users/quota', { method: 'GET' })
  }

  // Asset upload methods - Presigned URL flow
  async getPresignedUrl(fileName: string, contentType: string, propertyId: number, fileSize: number) {
    return this.request<{
      upload_url: string
      fields: Record<string, string>
      s3_key: string
      file_url: string
      expires_in: number
    }>('/api/v1/upload/presigned-url', {
      method: 'POST',
      body: JSON.stringify({
        file_name: fileName,
        content_type: contentType,
        property_id: propertyId,
        file_size: fileSize
      }),
    })
  }

  async completeUpload(propertyId: number, s3Key: string, fileName: string, fileSize: number, contentType: string) {
    return this.request<{
      message: string
      asset_id: string
      status: string
    }>('/api/v1/upload/complete', {
      method: 'POST',
      body: JSON.stringify({
        property_id: propertyId,
        s3_key: s3Key,
        file_name: fileName,
        file_size: fileSize,
        content_type: contentType
      }),
    })
  }

  // Asset methods (renamed from video methods)
  async getAssets(propertyId?: number, assetType?: string) {
    let endpoint = '/api/v1/assets/'
    const params = new URLSearchParams()
    
    if (propertyId) params.set('property_id', propertyId.toString())
    if (assetType) params.set('asset_type', assetType)
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }
    
    return this.request<any>(endpoint, { method: 'GET' })
  }

  async getAsset(assetId: string): Promise<any> {
    return this.request<any>(`/api/v1/assets/${assetId}`, { method: 'GET' })
  }

  async deleteAsset(assetId: string) {
    return this.request(`/api/v1/assets/${assetId}`, { method: 'DELETE' })
  }

  async restartAssetProcessing(assetId: string) {
    return this.request(`/api/v1/assets/${assetId}/restart-processing`, { method: 'POST' })
  }

  // Generic methods for future use
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient(API_BASE_URL)

// Text API for video timeline editor - adapted for cloud architecture
export const textApi = {
  getSuggestions: (propertyId?: string, category?: string, count?: number) => {
    const params = new URLSearchParams()
    if (propertyId) params.append('property_id', propertyId)
    if (category) params.append('category', category)
    if (count) params.append('count', count.toString())
    
    const query = params.toString()
    return api.get(`/api/v1/text/suggestions${query ? '?' + query : ''}`)
  },
  
  getCategories: () => api.get('/api/v1/text/categories'),
}

// Assets API for uploaded content (videos, images, etc.) - User uploads
export const assetsApi = {
  getAsset: (assetId: string) => api.getAsset(assetId),
  deleteAsset: (assetId: string) => api.deleteAsset(assetId),
  restartProcessing: (assetId: string) => api.restartAssetProcessing(assetId),
  getAssets: (propertyId?: number, assetType?: string) => api.getAssets(propertyId, assetType),
}

// Videos API for AI-generated videos - AI generation results
export const videosApi = {
  getAll: (propertyId?: number) => api.getGeneratedVideos(propertyId),
  getById: (videoId: string) => api.getGeneratedVideo(videoId),
  delete: (videoId: string) => api.deleteGeneratedVideo(videoId),
}