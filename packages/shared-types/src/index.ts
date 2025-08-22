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

// Property types
export interface Property {
  id: string
  name: string
  type: 'hotel' | 'airbnb' | 'restaurant' | 'vacation_rental'
  city: string
  country: string
  instagram?: string
  website?: string
  phone?: string
  language: string
  description?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreatePropertyRequest {
  name: string
  type: Property['type']
  city: string
  country: string
  instagram?: string
  website?: string
  phone?: string
  language: string
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  id: string
}

// Video types
export interface Video {
  id: string
  title: string
  description?: string
  video_url: string
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

export interface VideoMatchResponse {
  matches: Array<{
    viralVideo: ViralVideo
    similarity: number
    matchingScenes: VideoScene[]
  }>
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

// Error types
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Utility types
export type Nullable<T> = T | null
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Constants
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
] as const

export const PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'vacation_rental', label: 'Vacation Rental' },
] as const

export const USER_PLANS = [
  { value: 'free', label: 'Free', videoLimit: 2 },
  { value: 'pro', label: 'Pro', videoLimit: 50 },
  { value: 'enterprise', label: 'Enterprise', videoLimit: -1 },
] as const