'use client'

import { useState, useEffect } from 'react'
import { Video, Property } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { videosApi, propertiesApi } from '@/lib/api'
import { 
  Video as VideoIcon, 
  Download, 
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [videoTypeFilter, setVideoTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-refresh videos every 30 seconds to catch newly generated videos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Refresh when filters change
  useEffect(() => {
    fetchData()
  }, [selectedProperty, videoTypeFilter])

  const fetchData = async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      // Get the appropriate video type filter for API call
      const apiVideoType = videoTypeFilter === 'all' ? undefined : videoTypeFilter
      const apiPropertyId = selectedProperty === 'all' ? undefined : selectedProperty
      
      const [videosResponse, propertiesResponse] = await Promise.all([
        videosApi.getAll(apiPropertyId, apiVideoType),
        propertiesApi.getAll()
      ])
      
      setVideos(videosResponse.data)
      setProperties(propertiesResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredVideos = videos.filter(video => {
    const matchesProperty = selectedProperty === 'all' || video.property_id === selectedProperty
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter
    const matchesSearch = searchQuery === '' || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesProperty && matchesStatus && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'processing':
        return 'Processing'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading videos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Videos</h1>
          <p className="text-gray-600 mt-1">Manage and download your generated videos</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={videoTypeFilter} onValueChange={setVideoTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Videos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Videos</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {filteredVideos.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <VideoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {videos.length === 0 ? 'No videos yet' : 'No videos match your filters'}
          </h3>
          <p className="text-gray-600 mb-6">
            {videos.length === 0 
              ? 'Generate your first viral video to see it here'
              : 'Try adjusting your search or filters'
            }
          </p>
        </div>
      )}

      {/* Videos Grid */}
      {filteredVideos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const property = properties.find(p => p.id === video.property_id)
            
            return (
              <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Video Thumbnail/Preview */}
                <div className="aspect-video bg-gray-100 relative">
                  {video.thumbnail_url ? (
                    <Image 
                      src={video.thumbnail_url} 
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <VideoIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  
                  {video.status === 'completed' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center space-x-1 bg-black/60 text-white px-2 py-1 rounded text-xs">
                      {getStatusIcon(video.status)}
                      <span>{getStatusText(video.status)}</span>
                    </div>
                  </div>

                  {video.duration && (
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-black/60 text-white px-2 py-1 rounded text-xs">
                        {formatDuration(video.duration)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                      {video.title}
                    </h3>
                    {property && (
                      <p className="text-sm text-gray-600">
                        {property.name} • {property.city}
                      </p>
                    )}
                  </div>

                  {video.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{formatFileSize(video.size)}</span>
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>

                  {video.status === 'completed' && (
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          if (video.video_url) {
                            window.open(video.video_url, '_blank')
                          }
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          if (video.video_url) {
                            // Create a temporary link element and trigger download
                            const link = document.createElement('a')
                            link.href = video.video_url
                            link.download = `${video.title}.mp4`
                            link.target = '_blank'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}

                  {video.status === 'processing' && (
                    <div className="flex items-center justify-center py-2 text-yellow-600">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="text-sm">Processing video...</span>
                    </div>
                  )}

                  {video.status === 'failed' && (
                    <div className="flex items-center justify-center py-2 text-red-600">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">Generation failed</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}