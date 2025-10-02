'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'

interface Asset {
  id: string
  title: string
  thumbnail_url: string | null
  file_url: string
  duration: number | null
  status: string
  created_at: string
  property_id: string | number
  description?: string
}

export function useAssets(propertyId?: string, assetType?: string) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const recoveryIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the dedicated API method for getting assets (uploaded content)
      const propertyIdNumber = propertyId ? parseInt(propertyId) : undefined
      const response = await api.getAssets(propertyIdNumber, assetType) as { videos?: Asset[], data?: Asset[], assets?: Asset[] } | Asset[]
      
      // Handle different response formats from the API
      let assetsData: Asset[] = []
      if (Array.isArray(response)) {
        assetsData = response
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.assets)) {
          assetsData = response.assets
        } else if (Array.isArray(response.videos)) {
          assetsData = response.videos
        } else if (Array.isArray(response.data)) {
          assetsData = response.data
        }
      }
      
      setAssets(assetsData)
    } catch (err: any) {
      console.error('Assets fetch error:', err)
      const errorMessage = err.message || 'Failed to fetch assets'
      setError(errorMessage)
      
      // If authentication error, redirect to login
      if (err.message?.includes('401') || err.message?.includes('Not authenticated')) {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteAsset = async (id: string): Promise<void> => {
    try {
      await api.deleteAsset(id)
      setAssets(prev => prev.filter(asset => asset.id !== id))
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete asset')
    }
  }

  // DISABLED: Recovery system moved to page-level to avoid conflicts
  // Recovery system every 90 seconds for stuck assets
  // useEffect(() => {
  //   // This caused conflicts with page-level recovery system
  //   // Moved to assets/page.tsx to handle centrally
  // }, [assets, propertyId, assetType])

  useEffect(() => {
    fetchAssets()
  }, [propertyId, assetType])

  return {
    assets,
    loading,
    error,
    deleteAsset,
    refetch: fetchAssets,
  }
}