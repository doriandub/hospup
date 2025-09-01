import { User } from '@/types'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

// Storage helpers with Safari compatibility
export const storage = {
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        console.log('Tokens stored successfully')
      } catch (error) {
        console.error('Failed to store tokens (Safari private mode?):', error)
        // Fallback to sessionStorage for Safari private mode
        try {
          sessionStorage.setItem('access_token', accessToken)
          sessionStorage.setItem('refresh_token', refreshToken)
          console.log('Fallback: Tokens stored in sessionStorage')
        } catch (sessionError) {
          console.error('Both localStorage and sessionStorage failed:', sessionError)
        }
      }
    }
  },

  getTokens: () => {
    if (typeof window !== 'undefined') {
      try {
        const accessToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
        return { accessToken, refreshToken }
      } catch (error) {
        console.error('Failed to get tokens:', error)
        return { accessToken: null, refreshToken: null }
      }
    }
    return { accessToken: null, refreshToken: null }
  },

  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user', JSON.stringify(user))
      } catch (error) {
        console.error('Failed to store user (Safari private mode?):', error)
        try {
          sessionStorage.setItem('user', JSON.stringify(user))
        } catch (sessionError) {
          console.error('Both localStorage and sessionStorage failed for user:', sessionError)
        }
      }
    }
  },

  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
        if (userStr) {
          return JSON.parse(userStr)
        }
      } catch (error) {
        console.error('Failed to get user:', error)
      }
    }
    return null
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
        sessionStorage.removeItem('user')
      } catch (error) {
        console.error('Failed to clear auth:', error)
      }
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