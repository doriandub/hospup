import { api } from './api'

export interface User {
  id: string
  name: string
  email: string
  plan: string
  videos_used: number
  videos_limit: number
  created_at: string
}

export interface AuthResponse {
  user: User
}

class AuthService {
  private currentUser: User | null = null
  private authCheckPromise: Promise<boolean> | null = null

  // Register user
  async register(name: string, email: string, password: string): Promise<User> {
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ name, email, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Registration failed')
      }

      const user = await response.json()
      this.currentUser = user
      return user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Login user
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
      }

      const user = await response.json()
      this.currentUser = user
      return user
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.currentUser = null
    }
  }

  // Logout from all devices
  async logoutAll(): Promise<void> {
    try {
      await fetch('/api/v1/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout all error:', error)
    } finally {
      this.currentUser = null
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    // Return cached user if available
    if (this.currentUser) {
      return this.currentUser
    }

    // If already checking, wait for that promise
    if (this.authCheckPromise) {
      await this.authCheckPromise
      return this.currentUser
    }

    // Start auth check
    this.authCheckPromise = this.checkAuth()
    const isAuthenticated = await this.authCheckPromise
    this.authCheckPromise = null

    return isAuthenticated ? this.currentUser : null
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user !== null
  }

  // Private method to check auth status
  private async checkAuth(): Promise<boolean> {
    try {
      const response = await fetch('/api/v1/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const user = await response.json()
        this.currentUser = user
        return true
      } else {
        this.currentUser = null
        return false
      }
    } catch (error) {
      console.error('Auth check error:', error)
      this.currentUser = null
      return false
    }
  }

  // Get user synchronously (from cache)
  getUserSync(): User | null {
    return this.currentUser
  }

  // Clear cached user (for manual cache invalidation)
  clearCache(): void {
    this.currentUser = null
  }
}

// Export singleton instance
export const authService = new AuthService()

// Helper functions for compatibility with existing code
export const getToken = async (): Promise<string | null> => {
  // Since we use cookies, we don't need tokens anymore
  // This function exists for compatibility but always returns null
  console.warn('getToken() is deprecated - authentication now uses secure cookies')
  return null
}

export const getUser = async (): Promise<User | null> => {
  return authService.getCurrentUser()
}

export const setUser = (user: User): void => {
  // This function exists for compatibility but doesn't do anything
  // User data is managed by the AuthService
  console.warn('setUser() is deprecated - user data is managed automatically')
}

export const removeTokens = async (): Promise<void> => {
  await authService.logout()
}

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  return authService.isAuthenticated()
}