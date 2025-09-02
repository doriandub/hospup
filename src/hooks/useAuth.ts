import { useState, useEffect } from 'react'
import { authAPI, User } from '@/lib/api'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const userData = await authAPI.getMe()
      setUser(userData)
      console.log('✅ User authenticated:', userData.email)
    } catch (error) {
      setUser(null)
      console.log('❌ User not authenticated')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const userData = await authAPI.login({ email, password })
      setUser(userData)
      console.log('✅ Login successful:', userData.email)
      return userData
    } catch (error: any) {
      console.error('❌ Login failed:', error.message)
      throw error
    }
  }

  const register = async (name: string, email: string, password: string): Promise<User> => {
    try {
      const userData = await authAPI.register({ name, email, password })
      setUser(userData)
      console.log('✅ Registration successful:', userData.email)
      return userData
    } catch (error: any) {
      console.error('❌ Registration failed:', error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      console.log('✅ Logged out')
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
  }

  const refreshUser = async () => {
    await checkAuthStatus()
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  }
}