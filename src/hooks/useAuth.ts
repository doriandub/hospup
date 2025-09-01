'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User } from '@/types'
import { storage, AuthState } from '@/lib/auth'
import { authApi } from '@/lib/api'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthState() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  })

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return
    
    // Safari-specific: Add a small delay to ensure localStorage is ready
    const checkAuth = () => {
      try {
        // Check for existing auth on mount
        const user = storage.getUser()
        const { accessToken } = storage.getTokens()
        
        console.log('Auth check:', { user: !!user, token: !!accessToken, browser: navigator.userAgent.includes('Safari') })
        
        if (user && accessToken) {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            token: accessToken,
          })
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            token: null,
          })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          token: null,
        })
      }
    }
    
    // Safari needs a small delay sometimes
    if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
      setTimeout(checkAuth, 100)
    } else {
      checkAuth()
    }
  }, [])

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const response = await authApi.login({ email, password })
      const { access_token, refresh_token, user } = response.data
      
      storage.setTokens(access_token, refresh_token)
      storage.setUser(user)
      
      // Safari fix: Force state update with a slight delay
      const newState = {
        user,
        isAuthenticated: true,
        isLoading: false,
        token: access_token,
      }
      
      setState(newState)
      
      // Safari sometimes needs an extra push
      if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
        setTimeout(() => {
          setState(newState)
          console.log('Safari: Force state update after login')
        }, 50)
      }
      
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      })
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const response = await authApi.register({ name, email, password })
      const { access_token, refresh_token, user } = response.data
      
      storage.setTokens(access_token, refresh_token)
      storage.setUser(user)
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        token: access_token,
      })
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
      })
      throw error
    }
  }

  const logout = () => {
    storage.clearAuth()
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    })
  }

  return {
    ...state,
    login,
    register,
    logout,
  }
}

export { AuthContext }