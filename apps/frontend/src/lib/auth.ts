import { User } from '@/types'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

// Storage helpers
export const storage = {
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
    }
  },

  getTokens: () => {
    if (typeof window !== 'undefined') {
      return {
        accessToken: localStorage.getItem('access_token'),
        refreshToken: localStorage.getItem('refresh_token'),
      }
    }
    return { accessToken: null, refreshToken: null }
  },

  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
    }
  },

  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch {
          return null
        }
      }
    }
    return null
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  },
}

// Auth utilities
export const isAuthenticated = (): boolean => {
  const { accessToken } = storage.getTokens()
  return !!accessToken
}

export const requireAuth = () => {
  if (!isAuthenticated()) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }
}