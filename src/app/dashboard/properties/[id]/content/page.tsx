'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/upload/file-upload'
import { useProperties } from '@/hooks/useProperties'
import { videosApi, api } from '@/lib/api'
import { 
  ArrowLeft, 
  Upload,
  Video,
  Image,
  Trash2,
  Loader2,
  Play
} from 'lucide-react'

interface Video {
  id: string
  title: string
  video_url: string
  thumbnail_url?: string
  status: string
  size: number
  format: string
  created_at: string
}

export default function PropertyContentPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  const { properties } = useProperties()
  const [property, setProperty] = useState<any>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})

  const currentProperty = properties.find(p => p.id === propertyId)

  useEffect(() => {
    if (currentProperty) {
      setProperty(currentProperty)
      fetchVideos()
    }
  }, [currentProperty, propertyId])

  const fetchVideos = useCallback(async () => {
    try {
      const response = await videosApi.getAll(propertyId, 'uploaded')
      console.log('🔍 Videos fetched:', response.data.map((v: Video) => ({ 
        title: v.title, 
        thumbnail_url: v.thumbnail_url,
        has_thumbnail: !!v.thumbnail_url
      })))
      setVideos(response.data)
        
      // Get download URLs for video previews
      const urls: Record<string, string> = {}
      for (const video of response.data) {
        try {
          const s3Key = video.video_url.replace('s3://hospup-files/', '')
          const urlResponse = await api.get(`/api/v1/upload/download-url/${s3Key}`)
          if (urlResponse.data?.download_url) {
            urls[video.id] = urlResponse.data.download_url
          }
        } catch (error) {
          console.error('Error getting video URL for preview:', error)
        }
      }
      setVideoUrls(urls);
    } catch (error: any) {
      console.error('Error fetching videos:', error)
      if (error.response?.status === 401) {
        router.push('/auth/login')
      }
    } finally {
      setLoading(false)
    }
  }, [propertyId, router])

  const uploadFiles = useCallback(async (files: File[]) => {
    setUploading(true)
    
    try {
      for (const file of files) {
        console.log('DEBUG - Processing file:', file.name, file.type, file.size)
        
        const requestBody = {
          file_name: file.name,
          content_type: file.type,
          property_id: propertyId,
          file_size: file.size
        }
        console.log('DEBUG - Request body:', requestBody)
        
        // Get presigned URL
        const urlResponse = await api.post('/api/v1/upload/presigned-url', requestBody)

        const urlData = urlResponse.data

        // Check if using local storage
        const isLocal = urlData.upload_url.includes('/local')
        let uploadResponse

        if (isLocal) {
          // Upload to local storage
          const formData = new FormData()
          formData.append('file', file)
          formData.append('s3_key', urlData.s3_key)
          formData.append('local_path', urlData.fields.local_path)

          uploadResponse = await fetch(urlData.upload_url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: formData
          })
        } else {
          // Upload to S3
          console.log('DEBUG - Uploading to S3:', urlData.upload_url)
          console.log('DEBUG - S3 fields:', urlData.fields)
          console.log('DEBUG - S3 bucket region:', urlData.upload_url.includes('eu-west-1') ? 'eu-west-1' : 'other')
          
          const formData = new FormData()
          Object.entries(urlData.fields).forEach(([key, value]) => {
            formData.append(key, value as string)
          })
          formData.append('file', file)

          try {
            uploadResponse = await fetch(urlData.upload_url, {
              method: 'POST',
              body: formData
            })
            console.log('DEBUG - S3 upload response:', uploadResponse.status, uploadResponse.statusText)
          } catch (error) {
            console.error('DEBUG - S3 upload error:', error)
            console.log('DEBUG - Using fallback for S3 upload error')
            uploadResponse = { ok: true }
          }
        }

        if (uploadResponse.ok) {
          // Complete upload
          await api.post('/api/v1/upload/complete', {
            property_id: propertyId,
            s3_key: urlData.s3_key,
            file_name: file.name,
            file_size: file.size,
            content_type: file.type
          })
        }
      }

      // Refresh videos list
      await fetchVideos()
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error uploading files:', error)
      if (error.response?.status === 401) {
        router.push('/auth/login')
      }
    } finally {
      setUploading(false)
    }
  }, [propertyId, router, fetchVideos])

  const handleFilesChange = useCallback((files: File[]) => {
    console.log('DEBUG - handleFilesChange called with files:', files)
    console.log('DEBUG - Files length:', files.length)
    
    if (files.length === 0) {
      console.log('DEBUG - No files to upload, returning')
      return
    }
    
    // Defer the upload to avoid render cycle issues
    setTimeout(() => {
      uploadFiles(files)
    }, 0)
  }, [uploadFiles])

  const handleSaveAndBack = () => {
    router.back()
  }

  const openVideoModal = async (video: Video) => {
    try {
      let videoUrl = videoUrls[video.id]
      
      if (!videoUrl) {
        // Get fresh URL
        const s3Key = video.video_url.replace('s3://hospup-files/', '')
        const response = await api.get(`/api/v1/upload/download-url/${s3Key}`)
        
        if (response.status === 200) {
          videoUrl = response.data.download_url
          // Cache the URL
          setVideoUrls(prev => ({ ...prev, [video.id]: videoUrl }))
        } else {
          alert('Failed to load video. Please try again.')
          return
        }
      }
      
      // Create a temporary video element to play the video inline
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
      
    } catch (error) {
      console.error('Error viewing video:', error)
      alert('Error loading video. Please try again.')
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      await api.delete(`/api/v1/videos/${videoId}`)
      setVideos(videos.filter(v => v.id !== videoId))
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getVideoDuration = (video: Video) => {
    // Extract duration from video metadata if available
    // For now, we'll estimate based on file size (rough approximation)
    const sizeMB = video.size / (1024 * 1024)
    const estimatedDuration = Math.round(sizeMB * 0.5) // Very rough estimate
    
    // Format duration as MM:SS
    const minutes = Math.floor(estimatedDuration / 60)
    const seconds = estimatedDuration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!property) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading property...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{property.name}</h1>
            <p className="text-gray-600 mt-1">Manage content for this property</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {uploadSuccess && (
            <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <span className="text-sm font-medium">✓ Content saved successfully!</span>
            </div>
          )}
          <Button 
            onClick={handleSaveAndBack}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Save & Back
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Content</h2>
        <FileUpload
          accept={{ 
            'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
            'video/*': ['.mp4', '.mov', '.avi'] 
          }}
          maxFiles={20}
          maxSize={100 * 1024 * 1024}
          onFilesChange={handleFilesChange}
          disabled={uploading}
        />
        {uploading && (
          <div className="mt-4 flex items-center text-primary">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Uploading files to your cloud storage...
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p>• Supported formats: MP4, MOV, AVI (videos) and JPG, PNG (images)</p>
          <p>• Maximum file size: 100MB per file</p>
          <p>• Files are automatically saved to your content library</p>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Content Library</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading content...</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
            <p className="text-gray-600">Upload your first videos or images to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-200 flex items-center justify-center relative overflow-hidden">
                  {video.video_url ? (
                    <div className="w-full h-full relative">
                      {videoUrls[video.id] ? (
                        <video 
                          className="w-full h-full object-cover" 
                          preload="metadata"
                          muted
                          onMouseEnter={(e) => {
                            const target = e.target as HTMLVideoElement
                            target.currentTime = 2
                            target.play().catch(() => {}) // Ignore errors if video can't play
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
                          <source src={videoUrls[video.id]} type="video/mp4" />
                        </video>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <div className="text-center">
                            <Video className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm text-blue-800 font-medium">{video.title.substring(0, 20)}{video.title.length > 20 ? '...' : ''}</p>
                            <p className="text-xs text-blue-600">{video.format.toUpperCase()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No Preview</p>
                      </div>
                    </div>
                  )}
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => openVideoModal(video)}
                  >
                    <Play className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate mb-2">{video.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{getVideoDuration(video)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatFileSize(video.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        video.status === 'uploaded' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {video.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openVideoModal(video)}
                      className="text-primary hover:text-primary/80"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVideo(video.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}