'use client'

import { useState, useEffect, useRef } from 'react'
import { videosApi } from '@/lib/api'

interface Video {
  id: string
  title: string
  thumbnail_url: string | null
  video_url: string
  duration: number | null
  status: string
  created_at: string
  property_id: string
  description?: string
}

export function useVideos(propertyId?: string, videoType?: string) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const recoveryIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // System de récupération automatique toutes les 90 secondes
  useEffect(() => {
    // Toujours démarrer le système de récupération
    recoveryIntervalRef.current = setInterval(async () => {
      console.log('🔄 Recovery system: checking video statuses...')
      
      const currentVideos = videos
      
      // Chercher des vidéos qui ont des problèmes
      const problematicVideos = currentVideos.filter(video => {
        const createdAt = new Date(video.created_at)
        const now = new Date()
        const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60)
        
        // Vidéo en processing depuis plus de 5 minutes = problématique
        return (video.status === 'processing' || video.status === 'uploaded') && minutesSinceCreation > 5
      })

      if (problematicVideos.length > 0) {
        console.warn('🚨 Problematic videos found:', problematicVideos.map(v => v.id))
        
        // Tenter de relancer le processing
        for (const video of problematicVideos) {
          try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`http://localhost:8000/api/v1/videos/${video.id}/restart-processing`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.ok) {
              console.log(`✅ Restarted processing for video ${video.id}`)
            } else {
              console.error(`❌ Failed to restart video ${video.id}:`, await response.text())
            }
          } catch (error) {
            console.error(`❌ Error restarting video ${video.id}:`, error)
          }
        }
      }
      
      // Toujours refetch pour vérifier les statuts
      await fetchVideos()
      
    }, 90000) // 90 secondes
    
    // Cleanup
    return () => {
      if (recoveryIntervalRef.current) {
        clearInterval(recoveryIntervalRef.current)
        recoveryIntervalRef.current = null
      }
    }
  }, [videos, propertyId, videoType])

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