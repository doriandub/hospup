'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface SafeAuthWrapperProps {
  children: (auth: ReturnType<typeof useAuth>) => ReactNode
  fallback?: ReactNode
}

export function SafeAuthWrapper({ children, fallback = null }: SafeAuthWrapperProps) {
  try {
    const auth = useAuth()
    return <>{children(auth)}</>
  } catch (error) {
    console.error('AuthContext error:', error)
    return <>{fallback}</>
  }
}