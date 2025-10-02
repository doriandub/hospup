export interface User {
  id: string
  email: string
  plan_type: 'FREE' | 'PRO' | 'BUSINESS'
  properties_purchased: number
  custom_properties_limit?: number
  custom_monthly_videos?: number
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  message: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}