// User types
export interface User {
  id: string
  name: string
  email: string
  plan: 'free' | 'pro' | 'enterprise'
  videosUsed: number
  videosLimit: number
  subscriptionId?: string
  customerId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// Property types (matching backend API)
export interface Property {
  id: number
  user_id: number
  name: string
  description?: string
  address: string
  city: string
  country: string
  latitude?: number
  longitude?: number
  star_rating?: number
  total_rooms?: number
  website_url?: string
  phone?: string
  email?: string
  amenities?: string[]
  brand_colors?: string[]
  brand_style?: string
  is_active: boolean
  videos_generated: number
  created_at: string
  updated_at: string
}

// Video types
export interface Video {
  id: string
  title: string
  description?: string
  file_url: string
  thumbnail_url?: string
  status: 'processing' | 'completed' | 'failed'
  language: string
  duration?: number
  format: string
  size?: number
  property_id: string
  user_id: string
  created_at: string
  updated_at: string
}

// Generation types
export interface VideoGenerationRequest {
  inputType: 'photo' | 'text'
  inputData: string
  propertyId: string
  language: string
  viralVideoId?: string
}

export interface VideoGenerationResponse {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  estimatedTime?: number
  videoId?: string
}

export interface VideoMatchRequest {
  inputType: 'photo' | 'text'
  inputData: string
  limit?: number
}

export interface ViralVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  originalUrl: string
  tags: string[]
  style: string
  music?: string
  scenes: VideoScene[]
  createdAt: string
}

export interface VideoScene {
  id: string
  startTime: number
  endTime: number
  description: string
  tags: string[]
  embedding?: number[]
}

export interface VideoMatchResponse {
  matches: Array<{
    viralVideo: ViralVideo
    similarity: number
    matchingScenes: VideoScene[]
  }>
}

export interface CreatePropertyRequest {
  name: string
  description?: string
  address: string
  city: string
  country: string
  latitude?: number
  longitude?: number
  star_rating?: number
  total_rooms?: number
  website_url?: string
  phone?: string
  email?: string
  amenities?: string[]
  brand_colors?: string[]
  brand_style?: string
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  id: string
}

// Dashboard types
export interface DashboardStats {
  totalProperties: number
  totalVideos: number
  videosThisMonth: number
  storageUsed: number
  storageLimit: number
}

export interface ActivityItem {
  id: string
  type: 'video_generated' | 'property_created' | 'video_uploaded' | 'video_failed'
  title: string
  description: string
  timestamp: string
  propertyId?: string
  videoId?: string
}

// File upload types
export interface FileUploadRequest {
  fileName: string
  fileType: string
  fileSize: number
  propertyId?: string
}

export interface FileUploadResponse {
  uploadUrl: string
  fileKey: string
  expiresIn: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Constants
export const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'vacation_rental', label: 'Vacation Rental' }
] as const

export const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' }
] as const