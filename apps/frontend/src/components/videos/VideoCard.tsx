'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Play, 
  Download, 
  Eye, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Video
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'

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
  size?: number
}

interface Property {
  id: string
  name: string
  city?: string
  country?: string
}

interface VideoCardProps {
  video: Video
  property?: Property
  viewMode?: 'grid' | 'list'
  showProperty?: boolean
}

export function VideoCard({ 
  video, 
  property, 
  viewMode = 'grid', 
  showProperty = false 
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) {
      return '--:--'
    }
    const totalSeconds = Math.floor(seconds)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAIDescription = (description: string) => {
    // Only show description if it contains AI Analysis
    const aiAnalysisMatch = description.match(/AI Analysis:\s*(.+)/)
    if (aiAnalysisMatch) {
      return aiAnalysisMatch[1].trim()
    }
    
    // If description doesn't start with "Uploaded video:" and is not generic, show it
    if (!description.startsWith('Uploaded video:') && description.trim() !== '') {
      return description
    }
    
    // Don't show generic "Uploaded video: filename" descriptions
    return null
  }


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': // Legacy status
        return 'bg-green-100 text-green-800 border-green-200'
      case 'uploaded':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return <CheckCircle2 className="h-3 w-3" />
      case 'completed': // Legacy status
        return <CheckCircle2 className="h-3 w-3" />
      case 'uploaded':
        return <Clock className="h-3 w-3" />
      case 'processing':
        return <Loader2 className="h-3 w-3 animate-spin" />
      case 'failed':
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  // Load video URL on component mount (using same method as working properties page)
  useEffect(() => {
    const loadVideoUrl = async () => {
      if (!video.video_url) return
      
      try {
        // If it's already a full HTTP URL (processed video), use it directly
        if (video.video_url.startsWith('https://')) {
          setVideoUrl(video.video_url)
          return
        }
        
        // Otherwise, extract S3 key and get presigned URL
        const s3Key = video.video_url.replace('s3://hospup-files/', '')
        const response = await api.get(`/api/v1/upload/download-url/${s3Key}`)
        
        if (response.data && response.data.download_url) {
          setVideoUrl(response.data.download_url)
        }
      } catch (error) {
        console.error('Error getting video URL:', error)
      }
    }
    
    loadVideoUrl()
  }, [video.video_url])

  const handleDownload = async () => {
    if (!videoUrl) return
    
    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${video.title}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading video:', error)
    }
  }

  const openVideoModal = () => {
    if (!videoUrl) {
      alert('Video URL not ready. Please try again.')
      return
    }
    
    // Create a temporary video element to play the video inline (working method from Properties)
    const tempVideo = document.createElement('video')
    tempVideo.src = videoUrl
    tempVideo.controls = true
    tempVideo.autoplay = true
    tempVideo.style.width = '100%'
    tempVideo.style.height = 'auto'
    tempVideo.style.maxHeight = '80vh'
    
    // Create modal-like overlay
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    `
    
    const container = document.createElement('div')
    container.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 90%;
      max-height: 90%;
    `
    
    const closeButton = document.createElement('button')
    closeButton.textContent = '✕ Close'
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: #333;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
    `
    
    closeButton.onclick = () => {
      document.body.removeChild(overlay)
    }
    
    container.appendChild(tempVideo)
    overlay.appendChild(container)
    overlay.appendChild(closeButton)
    document.body.appendChild(overlay)
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay)
      }
    }
  }

  // List view content
  const listContent = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 p-4">
      <div className="flex items-center space-x-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-24 h-16 bg-gray-100 rounded-lg overflow-hidden relative">
          {videoUrl ? (
            <video 
              className="w-full h-full object-cover" 
              preload="metadata"
              muted
              onMouseEnter={(e) => {
                const target = e.target as HTMLVideoElement
                target.currentTime = 2
                target.play().catch(() => {})
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLVideoElement
                target.pause()
                target.currentTime = 0
              }}
              onError={() => {
                console.log(`Video preview failed for ${video.title}`)
              }}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : video.thumbnail_url ? (
            <img 
              src={video.thumbnail_url} 
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative">
              <div className="text-center">
                <Video className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                <div className="text-xs text-blue-600 font-medium">
                  {video.status === 'uploaded' ? 'Ready' : 'Video'}
                </div>
              </div>
            </div>
          )}
          {video.duration && video.duration > 0 && (
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
              {formatDuration(video.duration)}
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {video.title}
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(video.status)}`}>
                {getStatusIcon(video.status)}
                <span>{video.status}</span>
              </div>
            </div>
          </div>

          {showProperty && property && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Building2 className="h-4 w-4" />
              <span>{property.name}</span>
            </div>
          )}

          {(video.status?.toLowerCase() === 'ready' || video.status?.toLowerCase() === 'completed') && video.description && getAIDescription(video.description) && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {getAIDescription(video.description)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {(video.status === 'completed' || video.status === 'uploaded') && video.video_url && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={openVideoModal}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // Grid view
  const gridContent = (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-[9/16] bg-gray-100 relative overflow-hidden">
        {videoUrl ? (
          <div className="w-full h-full relative">
            <video 
              className="w-full h-full object-cover" 
              preload="metadata"
              muted
              onMouseEnter={(e) => {
                const target = e.target as HTMLVideoElement
                target.currentTime = 2
                target.play().catch(() => {})
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLVideoElement
                target.pause()
                target.currentTime = 0
              }}
              onError={() => {
                console.log(`Video preview failed for ${video.title}`)
              }}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        ) : video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative">
            <div className="text-center">
              <Video className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              <div className="text-sm text-blue-600 font-medium">
                {video.status === 'uploaded' ? 'Ready to Play' : 'Video File'}
              </div>
            </div>
          </div>
        )}
        
        {/* Overlay on hover */}
        {isHovered && (video.status === 'completed' || video.status === 'uploaded') && video.video_url && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={openVideoModal}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Duration */}
        {video.duration && video.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(video.status)}`}>
            {getStatusIcon(video.status)}
            <span>{video.status}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
            {video.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showProperty && property && (
          <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
            <Building2 className="h-3 w-3" />
            <span>{property.name}</span>
          </div>
        )}


        {(video.status?.toLowerCase() === 'ready' || video.status?.toLowerCase() === 'completed') && video.description && getAIDescription(video.description) && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
            {getAIDescription(video.description)}
          </p>
        )}
      </div>
    </div>
  )

  return viewMode === 'list' ? listContent : gridContent
}