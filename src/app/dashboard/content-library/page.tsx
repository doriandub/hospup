'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VideoCard } from '@/components/videos/VideoCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FolderOpen, Building2, Video, Grid3X3, List, Upload, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useProperties } from '@/hooks/useProperties'
import { useVideos } from '@/hooks/useVideos'

export default function ContentLibraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activePropertyId, setActivePropertyId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [processingStartTime, setProcessingStartTime] = useState<{[key: string]: number}>({})  
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Fetch properties and uploaded videos only (not generated videos)
  const { properties, loading: propertiesLoading } = useProperties()
  const { videos, loading: videosLoading, refetch: refetchVideos } = useVideos(undefined, 'uploaded')

  // Enhanced real-time refresh system: 10s for status checks, 60s restart for stuck processing
  useEffect(() => {
    const activeVideos = videos.filter(video => video.property_id === activePropertyId)
    const processingVideos = activeVideos.filter(video => 
      video.status?.toLowerCase() === 'processing' || 
      video.status?.toLowerCase() === 'uploaded'
    )

    if (processingVideos.length === 0 || !activePropertyId) {
      console.log('⏹️ Auto-refresh stopped (no processing videos)')
      return
    }

    // Track processing start times - only update if there are new processing videos
    const now = Date.now()
    const newProcessingTimes = { ...processingStartTime }
    let hasNewVideos = false
    processingVideos.forEach(video => {
      if (!newProcessingTimes[video.id]) {
        newProcessingTimes[video.id] = now
        hasNewVideos = true
      }
    })
    if (hasNewVideos) {
      setProcessingStartTime(newProcessingTimes)
    }

    console.log(`⏰ Real-time refresh active for ${processingVideos.length} processing videos`)
    
    // 10 second fast refresh for real-time status updates
    const fastRefreshInterval = setInterval(async () => {
      console.log(`🔄 Fast status check (10s interval) for ${processingVideos.length} videos...`)
      
      let needsFullRefresh = false
      let statusChanges: any[] = []
      
      // Check status for each processing video
      const statusChecks = processingVideos.map(async (video) => {
        try {
          const response = await fetch(`https://web-production-93a0d.up.railway.app/api/v1/videos/${video.id}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const updatedVideo = await response.json()
            // If video status changed, we need a full refresh
            if (updatedVideo.status !== video.status) {
              console.log(`📱 Status change detected: ${video.title} (${video.id.slice(0,8)}) ${video.status} → ${updatedVideo.status}`)
              statusChanges.push({ id: video.id, from: video.status, to: updatedVideo.status })
              needsFullRefresh = true
            } else {
              console.log(`⏸️ Status unchanged: ${video.title} (${video.id.slice(0,8)}) still ${video.status}`)
            }
          } else {
            console.error(`❌ Failed to fetch status for video ${video.id}: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.error(`❌ Network error checking status for video ${video.id}:`, error)
        }
      })
      
      await Promise.all(statusChecks)
      
      // If any status changed, refresh the entire list
      if (needsFullRefresh) {
        console.log(`🔄 ${statusChanges.length} status changes detected, refreshing full video list...`)
        console.log('Changes:', statusChanges)
        refetchVideos()
      } else {
        console.log('✅ No status changes detected, continuing monitoring...')
      }
    }, 10000) // 10 seconds for real-time feel

    // 60 second check for stuck processing videos + 24h cleanup (faster restart)
    const stuckCheckInterval = setInterval(() => {
      processingVideos.forEach(async (video) => {
        const processingTime = now - (newProcessingTimes[video.id] || now)
        
        // 24 hour cleanup (86400000 ms = 24 hours)
        if (processingTime > 86400000) {
          console.log(`🗑️ Video ${video.id} stuck in processing for ${Math.round(processingTime/3600000)}h, deleting...`)
          
          try {
            await fetch(`https://web-production-93a0d.up.railway.app/api/v1/videos/${video.id}`, {
              method: 'DELETE',
              credentials: 'include'
            })
            
            // Remove from processing times and refresh list
            const updatedTimes = { ...processingStartTime }
            delete updatedTimes[video.id]
            setProcessingStartTime(updatedTimes)
            refetchVideos()
            
            console.log(`🗑️ Video ${video.id} deleted after 24h of processing`)
          } catch (error) {
            console.error(`Failed to delete video ${video.id}:`, error)
          }
          return
        }
        
        // 60 second restart logic (faster than before)
        if (processingTime > 60000) { // 60 seconds instead of 90
          console.log(`⚠️ Video ${video.id} stuck in processing for ${Math.round(processingTime/1000)}s, restarting...`)
          
          try {
            // Restart processing by calling the backend
            await fetch(`https://web-production-93a0d.up.railway.app/api/v1/videos/${video.id}/restart-processing`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            })
            
            // Reset the start time
            newProcessingTimes[video.id] = Date.now()
            setProcessingStartTime({ ...newProcessingTimes })
          } catch (error) {
            console.error(`Failed to restart processing for video ${video.id}:`, error)
          }
        }
      })
    }, 60000) // Check every 60 seconds (faster)

    return () => {
      console.log('🛑 Real-time refresh intervals cleared')
      clearInterval(fastRefreshInterval)
      clearInterval(stuckCheckInterval)
    }
  }, [videos, refetchVideos, activePropertyId])

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
      router.replace(`/dashboard/content-library?${newSearchParams.toString()}`)
    }
  }, [properties, searchParams, activePropertyId, router])
  
  // Update URL when property changes
  const handlePropertyChange = useCallback((propertyId: string) => {
    setActivePropertyId(propertyId)
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('property', propertyId)
    router.replace(`/dashboard/content-library?${newSearchParams.toString()}`)
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const uploadSingleFile = async (file: File, propertyId: string) => {
    console.log('🎬 Direct upload started:', file.name, 'propertyId:', propertyId)
    
    if (!propertyId) {
      throw new Error('No property ID provided')
    }
    
    // Simple direct upload - the system that worked before!
    const formData = new FormData()
    formData.append('file', file)
    formData.append('property_id', propertyId)
    formData.append('title', file.name.split('.')[0])

    console.log('📤 Uploading directly to /api/v1/upload/')
    
    const response = await fetch('https://web-production-93a0d.up.railway.app/api/v1/upload/', {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Upload failed for ${file.name}:`, response.status, errorText)
      throw new Error(`Upload failed for ${file.name}: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('✅ Upload successful:', file.name, result)

    return result
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (!activePropertyId) {
      alert('Please select a property first')
      return
    }

    const files = Array.from(e.dataTransfer.files)
    const videoFiles = files.filter(file => file.type.startsWith('video/'))
    
    if (videoFiles.length === 0) {
      alert('Please drop video files only')
      return
    }

    setIsUploading(true)

    try {
      console.log(`📂 Starting upload of ${videoFiles.length} files to property:`, activePropertyId)
      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i]
        console.log(`📤 [${i + 1}/${videoFiles.length}] Uploading ${file.name}...`)
        
        await uploadSingleFile(file, activePropertyId)
        console.log(`✅ [${i + 1}/${videoFiles.length}] Successfully uploaded: ${file.name}`)
      }

      // Refresh videos list
      await refetchVideos()
    } catch (error) {
      console.error('❌ Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
      console.log('💡 Error details:', {
        message: errorMessage,
        activePropertyId,
        error
      })
      alert(`Upload failed: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }, [activePropertyId])

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
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3'
            : 'space-y-3'
        }>
          {/* Upload Content Card - Always visible */}
            {viewMode === 'grid' ? (
              <div 
                className={`border border-dashed rounded-xl shadow-sm p-6 cursor-pointer transition-all duration-200 group flex items-center justify-center min-h-[400px] ${
                  isDragOver || isUploading
                    ? 'bg-[#09725c]/20 border-[#09725c]/60'
                    : 'bg-[#09725c]/5 border-[#09725c]/30 hover:bg-[#09725c]/10 hover:shadow-md'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!activePropertyId) {
                    alert('Please select a property first')
                    return
                  }
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = 'video/*'
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) {
                      const dt = new DataTransfer()
                      Array.from(files).forEach(file => dt.items.add(file))
                      const dropEvent = new DragEvent('drop', { dataTransfer: dt })
                      await handleDrop(dropEvent as any)
                    }
                  }
                  input.click()
                }}
              >
                <div className="text-center">
                  <div className={`rounded-full p-4 transition-all mb-4 mx-auto w-16 h-16 flex items-center justify-center ${
                    isDragOver || isUploading
                      ? 'bg-[#09725c]/30'
                      : 'bg-[#09725c]/10 group-hover:bg-[#09725c]/20'
                  }`}>
                    <Upload className={`w-8 h-8 text-[#09725c] ${
                      isUploading ? 'animate-bounce' : ''
                    }`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-[#09725c]" style={{ fontFamily: 'Inter' }}>
                    {isUploading ? 'Uploading...' : isDragOver ? 'Drop videos here' : 'Upload Content'}
                  </h3>
                  <p className="text-base font-medium text-[#09725c]/80" style={{ fontFamily: 'Inter' }}>
                    {isUploading ? 'Upload in progress...' : 'Drag & drop or click to add videos'}
                  </p>
                </div>
              </div>
            ) : (
              <div 
                className={`border border-dashed rounded-xl shadow-sm p-4 cursor-pointer transition-all duration-200 group ${
                  isDragOver || isUploading
                    ? 'bg-[#09725c]/20 border-[#09725c]/60'
                    : 'bg-[#09725c]/5 border-[#09725c]/30 hover:bg-[#09725c]/10 hover:shadow-md'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (!activePropertyId) {
                    alert('Please select a property first')
                    return
                  }
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = 'video/*'
                  input.onchange = async (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) {
                      const dt = new DataTransfer()
                      Array.from(files).forEach(file => dt.items.add(file))
                      const dropEvent = new DragEvent('drop', { dataTransfer: dt })
                      await handleDrop(dropEvent as any)
                    }
                  }
                  input.click()
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-24 h-16 rounded-lg flex items-center justify-center ${
                    isDragOver || isUploading
                      ? 'bg-[#09725c]/30'
                      : 'bg-[#09725c]/10'
                  }`}>
                    <Upload className={`w-8 h-8 text-[#09725c] ${
                      isUploading ? 'animate-bounce' : ''
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#09725c] mb-1" style={{ fontFamily: 'Inter' }}>
                      {isUploading ? 'Uploading...' : isDragOver ? 'Drop videos here' : 'Upload Content'}
                    </h3>
                    <p className="text-sm text-[#09725c]/80" style={{ fontFamily: 'Inter' }}>
                      {isUploading ? 'Upload in progress...' : 'Drag & drop or click to add videos'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show videos if any exist */}
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
            
            {/* Empty state message when no videos - but upload card still visible */}
            {filteredVideos.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-600 mb-2">No videos uploaded yet</h3>
                <p className="text-sm text-gray-500">Use the upload card to add your first videos, or 
                  <Button 
                    variant="link" 
                    className="text-[#09725c] p-0 h-auto font-medium ml-1"
                    onClick={() => window.location.href = '/dashboard/generate'}
                  >
                    generate new content
                  </Button>
                </p>
              </div>
            )}
        </div>
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
            <div className="mt-2 flex items-center justify-center text-blue-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-xs">Real-time refresh active (10s status check, 60s restart check)</span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}