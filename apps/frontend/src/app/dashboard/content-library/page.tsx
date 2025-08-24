'use client'

import { useState, useEffect, useCallback } from 'react'
import { VideoCard } from '@/components/videos/VideoCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FolderOpen, Building2, Video, Grid3X3, List, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useProperties } from '@/hooks/useProperties'
import { useVideos } from '@/hooks/useVideos'
import { PropertyOnboardingModal } from '@/components/onboarding/PropertyOnboardingModal'

export default function ContentLibraryPage() {
  const [activePropertyId, setActivePropertyId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [showPropertyOnboarding, setShowPropertyOnboarding] = useState(false)

  // Fetch properties and uploaded videos only (not generated videos)
  const { properties, loading: propertiesLoading } = useProperties()
  const { videos, loading: videosLoading } = useVideos(undefined, 'uploaded')

  // Set first property as default when properties load
  useEffect(() => {
    if (properties.length > 0 && !activePropertyId) {
      setActivePropertyId(properties[0].id)
    }
  }, [properties, activePropertyId])

  const filteredVideos = videos.filter(video => {
    if (!activePropertyId) return false
    return video.property_id === activePropertyId
  })

  const getVideosCount = (propertyId: string) => {
    return videos.filter(v => v.property_id === propertyId).length
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

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
    setUploadProgress(0)

    try {
      const token = localStorage.getItem('access_token')
      
      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('property_id', activePropertyId)
        formData.append('title', file.name.split('.')[0])

        const response = await fetch('http://localhost:8000/api/v1/upload/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Upload failed for ${file.name}:`, response.status, errorText)
          throw new Error(`Upload failed for ${file.name}: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        console.log(`Successfully uploaded: ${file.name}`, result)

        setUploadProgress(((i + 1) / videoFiles.length) * 100)
      }

      // Refresh videos list
      window.location.reload()
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
      alert(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
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
    <div className="container mx-auto px-6 py-8">
      {/* Property Selection and View Mode Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex space-x-4">
          {/* Property Cards */}
          {properties.map((property) => (
            <div
              key={property.id}
              onClick={() => setActivePropertyId(property.id)}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 p-4 cursor-pointer ${
                activePropertyId === property.id
                  ? 'border-[#115446] bg-[#115446]/5'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  activePropertyId === property.id
                    ? 'bg-[#115446]/10'
                    : 'bg-gray-100'
                }`}>
                  <Building2 className={`h-4 w-4 ${
                    activePropertyId === property.id
                      ? 'text-[#115446]'
                      : 'text-gray-700'
                  }`} />
                </div>
                <div>
                  <h3 className={`font-medium text-sm ${
                    activePropertyId === property.id
                      ? 'text-[#115446]'
                      : 'text-gray-900'
                  }`} style={{ fontFamily: 'Inter' }}>
                    {property.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {getVideosCount(property.id)} videos
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Property Card */}
          <div
            onClick={() => setShowPropertyOnboarding(true)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 p-4 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-[#115446]/10 p-2 rounded-lg">
                <Building2 className="h-4 w-4 text-[#115446]" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-[#115446]" style={{ fontFamily: 'Inter' }}>
                  Add Property
                </h3>
                <p className="text-xs text-gray-500">
                  Create new property
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* View Mode Controls */}
        <div className="flex items-center bg-gray-100 rounded-lg p-4 h-[72px]">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="p-2 w-10 h-10"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="p-2 w-10 h-10 ml-1"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Videos Grid/List */}
      {activePropertyId ? (
        filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos for this property</h3>
            <p className="text-gray-600 mb-6">Upload or generate videos for this property to see them here</p>
            <Button onClick={() => window.location.href = '/dashboard/generate'}>
              Generate Video
            </Button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {/* Upload Content Card */}
            {viewMode === 'grid' ? (
              <div 
                className={`border border-dashed rounded-xl shadow-sm p-6 cursor-pointer transition-all duration-200 group flex items-center justify-center min-h-[400px] ${
                  isDragOver || isUploading
                    ? 'bg-[#115446]/20 border-[#115446]/60'
                    : 'bg-[#115446]/5 border-[#115446]/30 hover:bg-[#115446]/10 hover:shadow-md'
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
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) {
                      const dt = new DataTransfer()
                      Array.from(files).forEach(file => dt.items.add(file))
                      const dropEvent = new DragEvent('drop', { dataTransfer: dt })
                      handleDrop(dropEvent as any)
                    }
                  }
                  input.click()
                }}
              >
                <div className="text-center">
                  <div className={`rounded-full p-4 transition-all mb-4 mx-auto w-16 h-16 flex items-center justify-center ${
                    isDragOver || isUploading
                      ? 'bg-[#115446]/30'
                      : 'bg-[#115446]/10 group-hover:bg-[#115446]/20'
                  }`}>
                    <Upload className={`w-8 h-8 text-[#115446] ${
                      isUploading ? 'animate-bounce' : ''
                    }`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-[#115446]" style={{ fontFamily: 'Inter' }}>
                    {isUploading ? 'Uploading...' : isDragOver ? 'Drop videos here' : 'Upload Content'}
                  </h3>
                  <p className="text-base font-medium text-[#115446]/80" style={{ fontFamily: 'Inter' }}>
                    {isUploading ? `${Math.round(uploadProgress)}% complete` : 'Drag & drop or click to add videos'}
                  </p>
                  {isUploading && (
                    <div className="w-full bg-[#115446]/20 rounded-full h-2 mt-3">
                      <div 
                        className="bg-[#115446] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div 
                className={`border border-dashed rounded-xl shadow-sm p-4 cursor-pointer transition-all duration-200 group ${
                  isDragOver || isUploading
                    ? 'bg-[#115446]/20 border-[#115446]/60'
                    : 'bg-[#115446]/5 border-[#115446]/30 hover:bg-[#115446]/10 hover:shadow-md'
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
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files) {
                      const dt = new DataTransfer()
                      Array.from(files).forEach(file => dt.items.add(file))
                      const dropEvent = new DragEvent('drop', { dataTransfer: dt })
                      handleDrop(dropEvent as any)
                    }
                  }
                  input.click()
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-24 h-16 rounded-lg flex items-center justify-center ${
                    isDragOver || isUploading
                      ? 'bg-[#115446]/30'
                      : 'bg-[#115446]/10'
                  }`}>
                    <Upload className={`w-8 h-8 text-[#115446] ${
                      isUploading ? 'animate-bounce' : ''
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#115446] mb-1" style={{ fontFamily: 'Inter' }}>
                      {isUploading ? 'Uploading...' : isDragOver ? 'Drop videos here' : 'Upload Content'}
                    </h3>
                    <p className="text-sm text-[#115446]/80" style={{ fontFamily: 'Inter' }}>
                      {isUploading ? `${Math.round(uploadProgress)}% complete` : 'Drag & drop or click to add videos'}
                    </p>
                    {isUploading && (
                      <div className="w-full bg-[#115446]/20 rounded-full h-1 mt-2">
                        <div 
                          className="bg-[#115446] h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
        </div>
      )}

      {/* Property Onboarding Modal */}
      {showPropertyOnboarding && (
        <div className="fixed inset-0 z-50">
          <PropertyOnboardingModal 
            onClose={() => setShowPropertyOnboarding(false)}
            onSuccess={() => {
              console.log('Property created successfully!')
            }}
          />
        </div>
      )}
    </div>
  )
}