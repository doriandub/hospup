'use client'

import { useState, useEffect, useRef } from 'react'
import { InteractiveTextOverlay } from './interactive-text-overlay'
import { SimpleVideoCapture } from '@/services/simple-video-capture-mediaconvert'
import { Download, Loader2 } from 'lucide-react'

interface TemplateSlot {
  id: string
  order: number
  duration: number
  description: string
  start_time: number
  end_time: number
}

interface ContentVideo {
  id: string
  title: string
  thumbnail_url: string
  video_url: string
  duration: number
  description: string
}

interface SlotAssignment {
  slotId: string
  videoId: string | null
}

interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: { x: number; y: number }
  style: {
    color: string
    font_size: number
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
  }
}

interface PreviewVideoPlayerProps {
  templateSlots: TemplateSlot[]
  currentAssignments: SlotAssignment[]
  contentVideos: ContentVideo[]
  textOverlays: TextOverlay[]
  showDownloadButton?: boolean
}

export function PreviewVideoPlayer({
  templateSlots,
  currentAssignments,
  contentVideos,
  textOverlays,
  showDownloadButton = false
}: PreviewVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true) // Start playing immediately
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef1 = useRef<HTMLVideoElement | null>(null)
  const videoRef2 = useRef<HTMLVideoElement | null>(null)
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>('')
  const [activeVideoIndex, setActiveVideoIndex] = useState<1 | 2>(1)
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  // Get current slot
  const getCurrentSlot = () => currentSlotIndex

  // Get current video
  const getCurrentVideo = (): ContentVideo | null => {
    if (currentSlotIndex >= templateSlots.length) return null
    const currentSlot = templateSlots[currentSlotIndex]
    return getVideoForSlot(currentSlot.id)
  }

  // Get video for a specific slot
  const getVideoForSlot = (slotId: string): ContentVideo | null => {
    const assignment = currentAssignments.find(a => a.slotId === slotId)
    if (!assignment?.videoId) return null
    return contentVideos.find(v => v.id === assignment.videoId) || null
  }

  // Calculate current time for text overlays
  const getCurrentTime = () => {
    let totalTime = 0
    for (let i = 0; i < currentSlotIndex; i++) {
      totalTime += templateSlots[i]?.duration || 0
    }
    return totalTime
  }

  // Initialize first video and start playing
  useEffect(() => {
    const firstVideo = getCurrentVideo()
    if (firstVideo && !currentVideoSrc) {
      setCurrentVideoSrc(firstVideo.video_url)
      if (videoRef1.current) {
        videoRef1.current.src = firstVideo.video_url
        videoRef1.current.currentTime = 0

        const handleCanPlay = () => {
          // Auto-start playback when video is ready
          if (isPlaying) {
            videoRef1.current?.play().catch(() => {})
          }
        }

        videoRef1.current.addEventListener('canplaythrough', handleCanPlay)
        videoRef1.current.load()

        return () => {
          videoRef1.current?.removeEventListener('canplaythrough', handleCanPlay)
        }
      }
    }
  }, [templateSlots, currentAssignments, contentVideos, isPlaying])

  // Handle slot progression
  useEffect(() => {
    const newSlotIndex = getCurrentSlot()
    if (newSlotIndex !== currentSlotIndex) {
      setCurrentSlotIndex(newSlotIndex)
      const currentVideo = getCurrentVideo()
      if (currentVideo && currentVideo.video_url !== currentVideoSrc) {
        setCurrentVideoSrc(currentVideo.video_url)
      }
    }
  }, [currentSlotIndex])

  // Handle video switching with same logic as main editor
  useEffect(() => {
    if (currentVideoSrc) {
      const nextVideoIndex = activeVideoIndex === 1 ? 2 : 1
      const nextVideoRef = nextVideoIndex === 1 ? videoRef1 : videoRef2

      if (nextVideoRef.current) {
        const video = nextVideoRef.current
        video.src = currentVideoSrc
        video.currentTime = 0

        const handleCanPlay = () => {
          setActiveVideoIndex(nextVideoIndex)
          const prevVideoRef = activeVideoIndex === 1 ? videoRef1 : videoRef2
          if (prevVideoRef.current) {
            prevVideoRef.current.pause()
          }
          if (isPlaying) {
            video.play().catch(() => {})
          }
        }

        video.addEventListener('canplaythrough', handleCanPlay)
        video.load()

        return () => {
          video.removeEventListener('canplaythrough', handleCanPlay)
        }
      }
    }
  }, [currentVideoSrc])

  // Handle play/pause
  useEffect(() => {
    const activeVideoRef = activeVideoIndex === 1 ? videoRef1 : videoRef2
    if (activeVideoRef.current) {
      if (isPlaying) {
        activeVideoRef.current.play().catch(() => {})
      } else {
        activeVideoRef.current.pause()
      }
    }
  }, [isPlaying, activeVideoIndex])

  // Auto progression when playing
  useEffect(() => {
    if (isPlaying && templateSlots.length > 0) {
      const currentSlot = templateSlots[currentSlotIndex]
      const timeoutDuration = currentSlot ? currentSlot.duration * 1000 : 3000

      intervalRef.current = setTimeout(() => {
        const nextIndex = currentSlotIndex + 1
        if (nextIndex < templateSlots.length) {
          setCurrentSlotIndex(nextIndex)
          const nextVideo = getVideoForSlot(templateSlots[nextIndex].id)
          if (nextVideo) {
            setCurrentVideoSrc(nextVideo.video_url)
          }
        } else {
          setIsPlaying(false)
        }
      }, timeoutDuration)

      return () => {
        if (intervalRef.current) {
          clearTimeout(intervalRef.current)
        }
      }
    }
  }, [isPlaying, currentSlotIndex, templateSlots])

  const currentTime = getCurrentTime()

  // Calculate total video duration
  const getTotalDuration = () => {
    return templateSlots.reduce((total, slot) => total + slot.duration, 0) * 1000 // Convert to ms
  }

  // Handle video capture and download
  const handleDownloadVideo = async () => {
    if (!previewContainerRef.current) return

    try {
      setIsRecording(true)

      // Reset to beginning
      setCurrentSlotIndex(0)
      setIsPlaying(true)

      // Wait a moment for video to start
      await new Promise(resolve => setTimeout(resolve, 500))

      // Capture the entire video duration using new simple method
      const totalDuration = getTotalDuration()
      const blob = await SimpleVideoCapture.capturePreviewToVideo(previewContainerRef.current, totalDuration, {
        templateSlots,
        currentAssignments,
        contentVideos,
        textOverlays
      })

      setIsRecording(false)
      setIsUploading(true)

      // Upload to S3 and get download link
      try {
        const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'
        const filename = `video-${Date.now()}.${extension}`
        const s3Url = await SimpleVideoCapture.uploadToS3(blob, filename)

        // Open S3 URL in new tab for download
        window.open(s3Url, '_blank')
        setIsUploading(false)
      } catch (uploadError) {
        console.error('Upload failed, downloading locally:', uploadError)
        // Fallback to local download
        const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'
        SimpleVideoCapture.downloadBlob(blob, `video-${Date.now()}.${extension}`)
        setIsUploading(false)
      }

    } catch (error) {
      console.error('Video capture failed:', error)
      setIsRecording(false)
      setIsUploading(false)
      alert('Erreur lors de la capture vidéo. Veuillez réessayer.')
    }
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Download Button */}
      {showDownloadButton && (
        <div className="absolute top-2 right-2 z-50">
          <button
            onClick={handleDownloadVideo}
            disabled={isRecording || isUploading}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white font-medium transition-all ${
              isRecording || isUploading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
            title={isRecording ? 'Enregistrement en cours...' : isUploading ? 'Upload en cours...' : 'Télécharger la vidéo'}
          >
            {isRecording || isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isRecording ? 'Enregistrement...' : isUploading ? 'Upload...' : 'Télécharger'}
          </button>
        </div>
      )}

      {/* Video Container - exact same structure as main editor */}
      <div
        ref={previewContainerRef}
        className="relative w-full h-full overflow-hidden"
      >
        <div
          className="relative w-full h-full cursor-pointer"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {/* Video 1 - Same as main editor */}
          <video
            className={`absolute inset-0 w-full h-full object-cover ${
              activeVideoIndex === 1 ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            playsInline
            preload="auto"
            ref={videoRef1}
          />

          {/* Video 2 - Same as main editor */}
          <video
            className={`absolute inset-0 w-full h-full object-cover ${
              activeVideoIndex === 2 ? 'opacity-100' : 'opacity-0'
            }`}
            muted
            playsInline
            preload="auto"
            ref={videoRef2}
          />

          {/* Text Overlays - Same as main editor */}
          {textOverlays
            .filter(text => currentTime >= text.start_time && currentTime <= text.end_time)
            .map((textOverlay) => (
              <InteractiveTextOverlay
                key={textOverlay.id}
                textOverlay={textOverlay}
                isSelected={false}
                onSelect={() => {}}
                onUpdatePosition={() => {}}
                onUpdateSize={() => {}}
                containerWidth={300}
                containerHeight={533}
                scale={1}
              />
            ))}
        </div>
      </div>
    </div>
  )
}