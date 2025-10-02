'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface QuotaInfo {
  plan_type: string
  properties_limit: number
  properties_used: number
  properties_remaining: number
  can_create_more: boolean
  monthly_video_limit: number
  current_subscription_price_eur: number
}

export function useQuota() {
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuota = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Using default quota configuration
      const defaultQuota: QuotaInfo = {
        plan_type: 'free',
        properties_limit: 1,
        properties_used: 0,
        properties_remaining: 1,
        can_create_more: true,
        monthly_video_limit: 3,
        current_subscription_price_eur: 0
      }
      setQuotaInfo(defaultQuota)
    } catch (error) {
      console.error('Error fetching quota:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch quota')
    } finally {
      setLoading(false)
    }
  }

  const checkCanCreateProperty = (currentPropertiesCount = 0): boolean => {
    // If quota info is not loaded, use fallback logic
    if (!quotaInfo) return currentPropertiesCount < 1 // Default: 1 property for free plan
    
    return currentPropertiesCount < quotaInfo.properties_limit
  }

  const getRemainingProperties = (currentPropertiesCount = 0): number => {
    if (!quotaInfo) return Math.max(0, 1 - currentPropertiesCount) // Default: 1 property for free plan
    return Math.max(0, quotaInfo.properties_limit - currentPropertiesCount)
  }

  const getUsedProperties = (currentPropertiesCount = 0): number => {
    return currentPropertiesCount
  }

  const getPropertiesLimit = (): number => {
    return quotaInfo?.properties_limit ?? 1 // Default: 1 property for free plan
  }

  const hasQuotaInfo = (): boolean => {
    return quotaInfo !== null && !error
  }

  useEffect(() => {
    fetchQuota()
  }, [])

  return {
    quotaInfo,
    loading,
    error,
    fetchQuota,
    checkCanCreateProperty,
    getRemainingProperties,
    getUsedProperties,
    getPropertiesLimit,
    hasQuotaInfo,
  }
}