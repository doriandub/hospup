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
    
    // Check for existing auth on mount
    const user = storage.getUser()
    const { accessToken } = storage.getTokens()
    
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
  }, [])

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const response = await authApi.login({ email, password })
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