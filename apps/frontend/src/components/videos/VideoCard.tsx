'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Play, 
  Download, 
  Eye, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface Property {
  id: string
  name: string
  city: string
  country: string
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
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
      case 'completed':
        return <CheckCircle2 className="h-3 w-3" />
      case 'processing':
        return <Loader2 className="h-3 w-3 animate-spin" />
      case 'failed':
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const handleDownload = async () => {
    if (!video.video_url) return
    
    try {
      const response = await fetch(video.video_url)
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

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 p-4">
        <div className="flex items-center space-x-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-24 h-16 bg-gray-100 rounded-lg overflow-hidden relative">
            {video.thumbnail_url ? (
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Play className="h-6 w-6 text-gray-400" />
              </div>
            )}
            {video.duration > 0 && (
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

            {video.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {video.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {video.status === 'completed' && video.video_url && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(video.video_url, '_blank')}
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
  }

  // Grid view
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-[9/16] bg-gray-100 relative overflow-hidden">
        {video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Play className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Overlay on hover */}
        {isHovered && video.status === 'completed' && video.video_url && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(video.video_url, '_blank')}
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
        {video.duration > 0 && (
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


        {video.description && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
            {video.description}
          </p>
        )}
      </div>
    </div>
  )
}