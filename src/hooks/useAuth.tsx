'use client'

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import { User, AuthResponse } from '@/types/user'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = !!user

  // Check authentication status on mount and route changes
  const checkAuth = useCallback(async () => {
    try {
      const userData = await api.getCurrentUser()
      setUser(userData)
    } catch (error: any) {
      setUser(null)
      
      // Only redirect to login if we're on a protected route
      if (typeof window !== 'undefined' && pathname.startsWith('/dashboard')) {
        router.push('/auth/login')
      }
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router])

  // Refresh authentication (for token refresh)
  const refreshAuth = useCallback(async () => {
    try {
      await api.refreshToken()
      await checkAuth()
    } catch (error) {
      setUser(null)
    }
  }, [checkAuth])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.login(email, password) as AuthResponse
      setUser(response.user)
      
      // Redirect to dashboard after login
      const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
      router.push(redirectTo as any)
    } catch (error) {
      throw error
    }
  }, [router])

  // Register function
  const register = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.register(email, password) as AuthResponse
      setUser(response.user)
      
      // Redirect to dashboard after registration
      router.push('/dashboard' as any)
    } catch (error) {
      throw error
    }
  }, [router])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch (error) {
      // Logout error handled silently
    } finally {
      setUser(null)
      router.push('/' as any)
    }
  }, [router])

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user) return

    // Refresh token every 15 minutes (tokens expire in 20 minutes)
    const refreshInterval = setInterval(refreshAuth, 15 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [user, refreshAuth])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}