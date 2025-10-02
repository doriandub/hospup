'use client'

import { useState, useEffect } from 'react'
import { VideoCard } from '@/components/videos/VideoCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Search, Grid, List, Video, Upload, Filter } from 'lucide-react'

interface Video {
  id: string
  title: string
  description?: string
  thumbnail_url: string | null
  file_url: string
  status: string
  duration: number | null
  size?: number
  created_at: string
  property_id: string | number
}

interface Property {
  id: number
  name: string
  city?: string
  country?: string
}

export default function ContentLibraryPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProperty, setSelectedProperty] = useState<string>('all')
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    fetchVideos()
    fetchProperties()
  }, [])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/assets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch assets')
      }
      
      const data = await response.json()
      console.log('🔍 Backend response:', data)
      console.log('🔍 Videos data:', data.videos || [])
      if (data.videos && data.videos.length > 0) {
        console.log('🔍 First video example:', data.videos[0])
      }
      setVideos(data.videos || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties || [])
      }
    } catch (err) {
      console.error('Error fetching properties:', err)
    }
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesProperty = selectedProperty === 'all' || video.property_id.toString() === selectedProperty
    return matchesSearch && matchesProperty
  })

  const handleVideoView = (video: Video) => {
    setSelectedVideo(video)
  }

  const handleVideoDelete = async (videoId: string) => {
    try {
      const response = await fetch(`/api/assets/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        setVideos(videos.filter(v => v.id !== videoId))
      }
    } catch (err) {
      console.error('Error deleting video:', err)
    }
  }

  const getPropertyForVideo = (propertyId: string | number): Property | undefined => {
    return properties.find(p => p.id.toString() === propertyId.toString())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Library</h1>
          <p className="text-gray-600">Manage and organize your video content with AI-powered descriptions and thumbnails.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#09725c] focus:border-transparent"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id.toString()}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      {filteredVideos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found</span>
            <div className="flex items-center space-x-4">
              <span>{filteredVideos.filter(v => v.status === 'ready').length} ready</span>
              <span>{filteredVideos.filter(v => v.status === 'processing').length} processing</span>
            </div>
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <EmptyState
          icon={<Video className="w-12 h-12 text-gray-300" />}
          title="No videos found"
          description={searchTerm ? "Try adjusting your search terms." : "Upload your first video to get started."}
          action={
            <Button className="bg-[#09725c] hover:bg-[#09725c]/90">
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
          }
        />
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              property={getPropertyForVideo(video.property_id)}
              viewMode={viewMode}
              onView={handleVideoView}
              onDelete={handleVideoDelete}
            />
          ))}
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video
                  src={selectedVideo.file_url}
                  controls
                  className="w-full h-full"
                  poster={selectedVideo.thumbnail_url || undefined}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              
              {selectedVideo.description && (
                <div className="text-gray-700 text-sm">
                  <p className="font-medium mb-2">Description:</p>
                  <p>{selectedVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}