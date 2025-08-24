'use client'

import { useState, useEffect } from 'react'
import { videosApi } from '@/lib/api'

interface Video {
  id: string
  title: string
  thumbnail_url: string
  video_url: string
  duration: number
  status: string
  created_at: string
  property_id: string
  description?: string
}

export function useVideos(propertyId?: string, videoType?: string) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await videosApi.getAll(propertyId, videoType)
      setVideos(response.data || [])
    } catch (err: any) {
      console.error('Videos fetch error:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch videos'
      setError(errorMessage)
      
      // If authentication error, redirect to login
      if (err.response?.status === 401) {
        window.location.href = '/auth/login'
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteVideo = async (id: string): Promise<void> => {
    try {
      await videosApi.delete(id)
      setVideos(prev => prev.filter(video => video.id !== id))
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to delete video')
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [propertyId, videoType])

  return {
    videos,
    loading,
    error,
    deleteVideo,
    refetch: fetchVideos,
  }
}