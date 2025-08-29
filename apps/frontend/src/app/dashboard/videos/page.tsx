'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VideoCard } from '@/components/videos/VideoCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FolderOpen, Building2, Video, Grid3X3, List, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProperties } from '@/hooks/useProperties'
import { useVideos } from '@/hooks/useVideos'

export default function VideosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activePropertyId, setActivePropertyId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [scrollPosition, setScrollPosition] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Fetch properties and generated videos only
  const { properties, loading: propertiesLoading } = useProperties()
  const { videos, loading: videosLoading, refetch: refetchVideos } = useVideos(undefined, 'generated')

  // Handle URL params and property persistence
  useEffect(() => {
    if (properties.length === 0) return
    
    // Check URL for property ID first
    const propertyIdFromUrl = searchParams.get('property')
    
    if (propertyIdFromUrl && properties.find(p => p.id === propertyIdFromUrl)) {
      // URL has valid property ID, use it
      setActivePropertyId(propertyIdFromUrl)
    } else if (!activePropertyId) {
      // No URL param or invalid, set first property as default
      const firstPropertyId = properties[0].id
      setActivePropertyId(firstPropertyId)
      // Update URL to reflect the selected property
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.set('property', firstPropertyId)
      router.replace(`/dashboard/videos?${newSearchParams.toString()}`)
    }
  }, [properties, searchParams, activePropertyId, router])
  
  // Update URL when property changes
  const handlePropertyChange = useCallback((propertyId: string) => {
    setActivePropertyId(propertyId)
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('property', propertyId)
    router.replace(`/dashboard/videos?${newSearchParams.toString()}`)
  }, [searchParams, router])

  const filteredVideos = videos.filter(video => {
    if (!activePropertyId) return false
    return video.property_id === activePropertyId
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  const getVideosCount = (propertyId: string) => {
    return videos.filter(v => v.property_id === propertyId).length
  }

  // Check if auto-refresh is active (only for active property)
  const hasProcessingVideos = videos
    .filter(video => video.property_id === activePropertyId)
    .some(video => 
      video.status?.toLowerCase() === 'processing' || 
      video.status?.toLowerCase() === 'uploaded'
    )

  // Handle property navigation with transform instead of scroll
  const scrollLeft = useCallback(() => {
    const container = document.getElementById('property-container')
    if (container) {
      const newPosition = Math.max(0, scrollPosition - 300)
      container.style.transform = `translateX(-${newPosition}px)`
      setScrollPosition(newPosition)
    }
  }, [scrollPosition])

  const scrollRight = useCallback(() => {
    const container = document.getElementById('property-container')
    if (container) {
      const containerWidth = container.parentElement?.clientWidth || 0
      const contentWidth = container.scrollWidth
      const maxScroll = Math.max(0, contentWidth - containerWidth + 100) // +100 for spacing
      const newPosition = Math.min(maxScroll, scrollPosition + 300)
      container.style.transform = `translateX(-${newPosition}px)`
      setScrollPosition(newPosition)
    }
  }, [scrollPosition])

  // Check if arrows should be visible
  useEffect(() => {
    const checkScrollability = () => {
      const container = document.getElementById('property-container')
      if (container && container.parentElement) {
        const containerParentWidth = container.parentElement.clientWidth
        const contentWidth = container.scrollWidth
        const isScrollable = contentWidth > containerParentWidth
        
        console.log('Scroll check:', { containerParentWidth, contentWidth, scrollPosition, isScrollable })
        
        setCanScrollLeft(scrollPosition > 0)
        setCanScrollRight(isScrollable && scrollPosition < (contentWidth - containerParentWidth + 50))
      }
    }
    
    // Check immediately and after a delay to ensure DOM is ready
    checkScrollability()
    const timeoutId = setTimeout(checkScrollability, 500)
    
    // Also check on window resize
    window.addEventListener('resize', checkScrollability)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkScrollability)
    }
  }, [properties, scrollPosition])

  const loading = propertiesLoading || videosLoading

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-full overflow-hidden">
      {/* Hide scrollbar styles */}
      <style jsx>{`
        #property-container::-webkit-scrollbar {
          display: none;
        }
        #property-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Property Selection - Clean Design with Arrows Around Properties */}
      <div className="mb-8">
        {/* Container aligned with the video grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3">
          {/* Property navigation spans the first 3 columns */}
          <div className="lg:col-span-3 xl:col-span-3 md:col-span-1 col-span-1">
            <div className="flex items-center">
              {/* Left Arrow - Always visible when needed */}
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={`flex-shrink-0 p-2 transition-colors rounded-lg mr-4 ${
                  canScrollLeft 
                    ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer' 
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {/* Property Names Container */}
              <div className="flex-1 overflow-hidden relative">
                {/* Gradient fade effect on the left */}
                {canScrollLeft && (
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-50 via-gray-50/60 via-gray-50/30 to-transparent z-10 pointer-events-none" />
                )}
                {/* Gradient fade effect on the right */}
                {canScrollRight && (
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-50 via-gray-50/60 via-gray-50/30 to-transparent z-10 pointer-events-none" />
                )}
                <div 
                  id="property-container"
                  className="flex items-center space-x-8 pb-1 transition-transform duration-300"
                  style={{ minWidth: 'max-content', overflow: 'visible' }}
                >
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      onClick={() => handlePropertyChange(property.id)}
                      className={`flex items-center space-x-2 py-2 cursor-pointer transition-all duration-200 whitespace-nowrap border-b-2 ${
                        activePropertyId === property.id
                          ? 'text-[#09725c] border-[#09725c] font-semibold'
                          : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-200'
                      }`}
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="text-base" style={{ fontFamily: 'Inter' }}>
                        {property.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activePropertyId === property.id
                          ? 'bg-[#09725c]/10 text-[#09725c]'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {getVideosCount(property.id)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right Arrow - Always visible when needed */}
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={`flex-shrink-0 p-2 transition-colors rounded-lg ml-4 ${
                  canScrollRight 
                    ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 cursor-pointer' 
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Sort and View Controls - Aligned with the last grid column */}
          <div className="lg:col-span-1 xl:col-span-1 md:col-span-1 col-span-1 flex items-center justify-end space-x-3">
            {/* Sort Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="text-sm font-medium">{sortOrder === 'newest' ? 'Plus récent' : 'Plus ancien'}</span>
            </Button>
            
            {/* View Mode Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              <span className="text-sm font-medium">{viewMode === 'grid' ? 'Liste' : 'Grille'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Videos Grid/List */}
      {activePropertyId ? (
        filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos for this property</h3>
            <p className="text-gray-600 mb-6">Generate videos for this property to see them here</p>
            <Button onClick={() => window.location.href = '/dashboard/generate'}>
              Generate Video
            </Button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3'
              : 'space-y-3'
          }>
            {filteredVideos.map((video) => {
              const property = properties.find(p => p.id === video.property_id)
              return (
                <VideoCard
                  key={video.id}
                  video={video}
                  property={property}
                  viewMode={viewMode}
                  showProperty={false}
                />
              )
            })}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a property to view videos</h3>
          <p className="text-gray-600">Choose a property from the tabs above to see its video content</p>
        </div>
      )}

      {/* Stats */}
      {filteredVideos.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Showing {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
          {activePropertyId && (
            <span> for {properties.find(p => p.id === activePropertyId)?.name}</span>
          )}
          {hasProcessingVideos && (
            <div className="mt-2 flex items-center justify-center space-x-4 text-blue-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-xs">Processing videos detected</span>
              </div>
              <button
                onClick={() => {
                  console.log('Force refresh triggered')
                  refetchVideos()
                }}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                🔄 Force Refresh
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}