'use client'

import { useState, useEffect } from 'react'
import { videosApi } from '@/lib/api'

interface Video {
  id: string
  title: string
  description?: string
  video_url?: string
  thumbnail_url?: string
  duration: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  property_id: number
  template_id?: string
  generation_method: 'ffmpeg' | 'aws_mediaconvert'
  aws_job_id?: string
  ai_description?: string
  created_at: string
  completed_at?: string
}

export function useVideos(propertyId?: number) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the dedicated API method for getting generated videos (AI-generated content)
      const response = await videosApi.getAll(propertyId)
      setVideos(Array.isArray(response) ? response : [])
    } catch (err: any) {
      console.error('Videos fetch error:', err)
      const errorMessage = err.message || 'Failed to fetch videos'
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

  const deleteVideo = async (id: string): Promise<void> => {
    try {
      await videosApi.delete(id)
      setVideos(prev => prev.filter(video => video.id !== id))
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete video')
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [propertyId])

  return {
    videos,
    loading,
    error,
    deleteVideo,
    refetch: fetchVideos,
  }
}