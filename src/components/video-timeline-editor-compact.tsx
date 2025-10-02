'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  Video
} from 'lucide-react'
import { TextFormattingToolbar } from './text-formatting-toolbar'
import { InteractiveTextOverlay } from './interactive-text-overlay'

// Text overlay block component with resize functionality
function TextOverlayBlock({
  text,
  totalDuration,
  onUpdateTextOverlay,
  onTextSelect,
  isSelected
}: {
  text: any
  totalDuration: number
  onUpdateTextOverlay?: (textId: string, updates: any) => void
  onTextSelect?: (textId: string | null) => void
  isSelected?: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<'move' | 'resize-left' | 'resize-right' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, startTime: 0, endTime: 0 })

  const startPercent = (text.start_time / totalDuration) * 100
  const widthPercent = ((text.end_time - text.start_time) / totalDuration) * 100

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
    e.preventDefault()
    // Don't auto-select here - let handleClick manage selection
    setIsDragging(true)
    setDragType(type)
    setDragStart({
      x: e.clientX,
      startTime: text.start_time,
      endTime: text.end_time
    })
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Toggle selection: if already selected, deselect, otherwise select
    if (isSelected) {
      onTextSelect?.(null)  // Deselect by passing null
    } else {
      onTextSelect?.(text.id)  // Select this text
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragType || !onUpdateTextOverlay) return

    const containerWidth = (e.target as HTMLElement).closest('.relative')?.clientWidth || 400
    const deltaX = e.clientX - dragStart.x
    const deltaTime = (deltaX / containerWidth) * totalDuration

    let newStartTime = dragStart.startTime
    let newEndTime = dragStart.endTime

    switch (dragType) {
      case 'move':
        newStartTime = Math.max(0, dragStart.startTime + deltaTime)
        newEndTime = Math.min(totalDuration, dragStart.endTime + deltaTime)
        break
      case 'resize-left':
        newStartTime = Math.max(0, Math.min(dragStart.startTime + deltaTime, dragStart.endTime - 0.5))
        break
      case 'resize-right':
        newEndTime = Math.min(totalDuration, Math.max(dragStart.endTime + deltaTime, dragStart.startTime + 0.5))
        break
    }

    onUpdateTextOverlay(text.id, {
      start_time: newStartTime,
      end_time: newEndTime
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragType(null)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragType, dragStart])

  return (
    <div
      className={`absolute top-0 bottom-0 rounded flex items-center justify-center group select-none ${
        isSelected
          ? 'bg-blue-700 bg-opacity-90 border-2 border-blue-800 ring-2 ring-blue-400'
          : 'bg-blue-500 bg-opacity-80 border border-blue-600'
      }`}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        minWidth: '40px'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onClick={handleClick}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 bg-blue-700 cursor-w-resize opacity-0 group-hover:opacity-100 z-10"
        onMouseDown={(e) => {
          e.stopPropagation()
          handleMouseDown(e, 'resize-left')
        }}
      />

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 bg-blue-700 cursor-e-resize opacity-0 group-hover:opacity-100 z-10"
        onMouseDown={(e) => {
          e.stopPropagation()
          handleMouseDown(e, 'resize-right')
        }}
      />

      {/* Text content */}
      <span className="text-white text-xs font-medium truncate px-1 cursor-move">
        {text.content}
      </span>
    </div>
  )
}

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
  confidence?: number
}

interface TimelineEditorProps {
  templateTitle: string
  templateSlots: TemplateSlot[]
  contentVideos: ContentVideo[]
  onGenerate: (assignments: SlotAssignment[], texts: any[]) => void
  propertyId: string
  templateId: string
  onAddText?: () => void
  onGenerateVideo?: () => void
  onTimelineUpdate?: (assignments: SlotAssignment[], texts: any[]) => void
  draggedVideo?: ContentVideo | null
  textOverlays?: any[]
  onUpdateTextOverlay?: (textId: string, updates: any) => void
  onDeleteTextOverlay?: (textId: string) => void
  selectedTextId?: string | null
  onTextSelect?: (textId: string | null) => void
  activeTool?: string | null
  onToolChange?: (tool: string | null) => void
  isTextTabActive?: boolean
  previewMode?: boolean
}

export function VideoTimelineEditor({
  templateTitle,
  templateSlots,
  contentVideos,
  onGenerate,
  propertyId,
  templateId,
  onAddText,
  onGenerateVideo,
  onTimelineUpdate,
  draggedVideo,
  textOverlays = [],
  onUpdateTextOverlay,
  onDeleteTextOverlay,
  selectedTextId,
  onTextSelect,
  activeTool,
  onToolChange,
  isTextTabActive,
  previewMode = false
}: TimelineEditorProps) {
  const [assignments, setAssignments] = useState<SlotAssignment[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef1 = useRef<HTMLVideoElement | null>(null)
  const videoRef2 = useRef<HTMLVideoElement | null>(null)
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>('')
  const [activeVideoIndex, setActiveVideoIndex] = useState<1 | 2>(1)
  const [activePanel, setActivePanel] = useState<string | null>(null)

  // Function to duplicate text exactly (same position, same content)
  const handleDuplicateText = (textId: string) => {
    if (textId && onTimelineUpdate) {
      const selectedText = textOverlays.find(t => t.id === textId)
      if (selectedText) {
        const newText = {
          ...selectedText,
          id: Date.now().toString() // Only change the ID to make it unique
          // Keep everything else exactly the same: content, position, style, timing
        }
        onTimelineUpdate(assignments, [...textOverlays, newText])
      }
    }
  }

  const totalDuration = templateSlots.reduce((sum, slot) => sum + slot.duration, 0)

  // Handle keyboard events for text deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTextId && onDeleteTextOverlay) {
          e.preventDefault()
          onDeleteTextOverlay(selectedTextId)
          onTextSelect?.(null) // Deselect after delete
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedTextId, onDeleteTextOverlay, onTextSelect])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleUpdateTextOrder = (newTexts: any[]) => {
    // Update the text order and inform parent component
    onTimelineUpdate?.(assignments, newTexts)
  }

  const getVideoForSlot = (slotId: string): ContentVideo | null => {
    const assignment = assignments.find(a => a.slotId === slotId)
    if (!assignment?.videoId) return null
    return contentVideos.find(v => v.id === assignment.videoId) || null
  }

  const assignVideoToSlot = (slotId: string, videoId: string) => {
    const newAssignments = assignments.filter(a => a.slotId !== slotId)
    newAssignments.push({ slotId, videoId })
    setAssignments(newAssignments)
    // CORRECTION: Préserver les textOverlays existants au lieu de les supprimer
    onTimelineUpdate?.(newAssignments, textOverlays)
  }

  const canVideoFitSlot = (video: ContentVideo, slot: TemplateSlot): boolean => {
    return video.duration >= slot.duration * 0.8
  }

  const getCurrentSlot = () => {
    let cumulativeTime = 0
    for (let i = 0; i < templateSlots.length; i++) {
      if (currentTime >= cumulativeTime && currentTime < cumulativeTime + templateSlots[i].duration) {
        return i
      }
      cumulativeTime += templateSlots[i].duration
    }
    return templateSlots.length - 1
  }

  const getCurrentVideo = () => {
    const currentSlot = templateSlots[getCurrentSlot()]
    if (!currentSlot) return null
    return getVideoForSlot(currentSlot.id)
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      // Pause
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPlaying(false)
    } else {
      // Play
      setIsPlaying(true)
      intervalRef.current = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 0.1
          if (newTime >= totalDuration) {
            setIsPlaying(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            return 0
          }
          return newTime
        })
      }, 100)
    }
  }

  useEffect(() => {
    // Initialize first video on component mount
    const firstVideo = getCurrentVideo()
    if (firstVideo && !currentVideoSrc) {
      setCurrentVideoSrc(firstVideo.video_url)
      // Load the first video directly into video1
      if (videoRef1.current) {
        videoRef1.current.src = firstVideo.video_url
        videoRef1.current.currentTime = 0
        videoRef1.current.load()
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Initialize video src if not set but we have videos
    if (!currentVideoSrc && templateSlots.length > 0) {
      const firstSlot = templateSlots[0]
      const firstVideo = getVideoForSlot(firstSlot.id)
      if (firstVideo) {
        setCurrentVideoSrc(firstVideo.video_url)
      }
    }
  }, [templateSlots, assignments, currentVideoSrc])

  useEffect(() => {
    const newSlotIndex = getCurrentSlot()
    if (newSlotIndex !== currentSlotIndex) {
      setCurrentSlotIndex(newSlotIndex)
      // Change video source when changing slot
      const currentVideo = getCurrentVideo()
      if (currentVideo && currentVideo.video_url !== currentVideoSrc) {
        setCurrentVideoSrc(currentVideo.video_url)
      }
    }
  }, [currentTime, currentSlotIndex, currentVideoSrc])

  useEffect(() => {
    if (currentVideoSrc) {
      const nextVideoIndex = activeVideoIndex === 1 ? 2 : 1
      const nextVideoRef = nextVideoIndex === 1 ? videoRef1 : videoRef2

      if (nextVideoRef.current) {
        const video = nextVideoRef.current
        video.src = currentVideoSrc
        video.currentTime = 0

        const handleCanPlay = () => {
          // Switch to the new video
          setActiveVideoIndex(nextVideoIndex)

          // Pause the previous video
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

  return (
    <div className={`h-full ${previewMode ? 'bg-transparent' : 'bg-gray-50'} flex flex-col`}>
      {/* Text Formatting Toolbar - Au-dessus du Video Preview */}
      {!previewMode && (
        <TextFormattingToolbar
          selectedTextId={selectedTextId || null}
          selectedTextOverlay={selectedTextId ? textOverlays.find(t => t.id === selectedTextId) : null}
          onUpdateText={onUpdateTextOverlay || (() => {})}
          onToolChange={onToolChange || (() => {})}
          activeTool={activeTool || null}
          isTextTabActive={isTextTabActive}
          onDeleteText={onDeleteTextOverlay}
          onDuplicateText={handleDuplicateText}
          onPanelChange={setActivePanel}
          activePanel={activePanel}
        />
      )}

      {/* Video Preview */}
      <div className={`flex flex-col items-center ${previewMode ? 'py-0' : 'py-3'}`}>

        {/* Video Preview - Larger in preview mode */}
        <div className={`bg-gray-900 rounded flex items-center justify-center overflow-hidden relative ${
          previewMode
            ? 'w-80 h-[calc(80*16/9)] max-w-full max-h-full' // Bigger for preview mode
            : 'w-36 h-64' // Original compact size
        }`}>
          {currentVideoSrc ? (
            <>
              {/* Video 1 */}
              <video
                className={`absolute inset-0 w-full h-full object-cover ${
                  activeVideoIndex === 1 ? 'opacity-100' : 'opacity-0'
                }`}
                muted
                playsInline
                preload="auto"
                ref={videoRef1}
              />

              {/* Video 2 */}
              <video
                className={`absolute inset-0 w-full h-full object-cover ${
                  activeVideoIndex === 2 ? 'opacity-100' : 'opacity-0'
                }`}
                muted
                playsInline
                preload="auto"
                ref={videoRef2}
              />

              {/* Interactive Text Overlays on Video */}
              {textOverlays.map((text) => {
                // Show text if current time is within its time range
                const isVisible = currentTime >= text.start_time && currentTime <= text.end_time
                if (!isVisible) return null

                return (
                  <InteractiveTextOverlay
                    key={text.id}
                    textOverlay={text}
                    isSelected={selectedTextId === text.id}
                    onSelect={onTextSelect || (() => {})}
                    onUpdatePosition={(textId, position) => {
                      onUpdateTextOverlay?.(textId, { position })
                    }}
                    onUpdateSize={(textId, fontSize) => {
                      onUpdateTextOverlay?.(textId, {
                        style: {
                          ...text.style,
                          font_size: fontSize
                        }
                      })
                    }}
                    onUpdateContent={(textId, content) => {
                      onUpdateTextOverlay?.(textId, { content })
                    }}
                    containerWidth={144} // w-36 = 144px
                    containerHeight={256} // h-64 = 256px
                    scale={0.5} // Scale down for preview
                  />
                )
              })}
            </>
          ) : (
            // Écran noir pour voir les textes même sans vidéo
            <div className="w-full h-full bg-black" />
          )}

          {/* Text Overlays - Always visible even without video */}
          {!currentVideoSrc && textOverlays.map((text) => {
            // Show text if current time is within its time range
            const isVisible = currentTime >= text.start_time && currentTime <= text.end_time
            if (!isVisible) return null

            return (
              <InteractiveTextOverlay
                key={text.id}
                textOverlay={text}
                isSelected={selectedTextId === text.id}
                onSelect={onTextSelect || (() => {})}
                onUpdatePosition={(textId, position) => {
                  onUpdateTextOverlay?.(textId, { position })
                }}
                onUpdateSize={(textId, fontSize) => {
                  onUpdateTextOverlay?.(textId, {
                    style: {
                      ...text.style,
                      font_size: fontSize
                    }
                  })
                }}
                onUpdateContent={(textId, content) => {
                  onUpdateTextOverlay?.(textId, { content })
                }}
                containerWidth={144} // w-36 = 144px
                containerHeight={256} // h-64 = 256px
                scale={0.5} // Scale down for preview
              />
            )
          })}
        </div>

        {/* Compact Play Controls - Show different controls in preview mode */}
        {previewMode ? (
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm text-white bg-black/50 px-2 py-1 rounded">{formatTime(currentTime)}</span>
            <Button
              variant="outline"
              size="lg"
              onClick={togglePlayPause}
              className="w-12 h-12 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <span className="text-sm text-white bg-black/50 px-2 py-1 rounded">{formatTime(totalDuration)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-600">{formatTime(currentTime)}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              className="w-8 h-8 p-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <span className="text-xs text-gray-600">{formatTime(totalDuration)}</span>
          </div>
        )}
      </div>

      {/* Timeline - Hide in preview mode */}
      {!previewMode && (
        <>
          {/* Gray Separator with Timing */}
          <div className="border-t border-gray-300 bg-gray-100 px-4 py-1">
        <div className="relative flex">
          {/* Timeline segments for timing positioning */}
          {templateSlots.map((slot, index) => {
            const cumulativeTime = templateSlots.slice(0, index + 1).reduce((sum, s) => sum + s.duration, 0)
            return (
              <div
                key={slot.id}
                className="relative flex-1"
                style={{
                  width: `${(slot.duration / totalDuration) * 100}%`,
                  minWidth: '50px'
                }}
              >
                {/* Duration at the end of each segment (segment boundary) */}
                <div className="absolute right-0 top-0 text-xs text-gray-600 transform translate-x-1/2">
                  {cumulativeTime.toFixed(1)}s
                </div>
              </div>
            )
          })}

          {/* Start time at the very beginning */}
          <div className="absolute left-0 top-0 text-xs text-gray-600">
            0s
          </div>
        </div>
      </div>

      {/* Compact Timeline at Bottom */}
      <div className="bg-white border-t border-gray-200 p-3">
        {/* Text Overlays Timeline - Aligned with video timeline */}
        <div className="mb-3 relative">
          {/* Calculate the number of rows needed */}
          {textOverlays.length > 0 ? (
            <div className="space-y-1">
              {textOverlays.map((text, index) => (
                <div key={text.id} className="relative">
                  {/* Timeline base for this row - same structure as video timeline */}
                  <div className="relative flex rounded overflow-hidden border h-8">
                    {templateSlots.map((slot) => (
                      <div
                        key={`text-slot-${slot.id}-${index}`}
                        className="relative border-r border-gray-200 last:border-r-0 bg-gray-50"
                        style={{
                          width: `${(slot.duration / totalDuration) * 100}%`,
                          minWidth: '50px'
                        }}
                      />
                    ))}

                    {/* Text overlay for this row */}
                    <TextOverlayBlock
                      text={text}
                      totalDuration={totalDuration}
                      onUpdateTextOverlay={onUpdateTextOverlay}
                      onTextSelect={onTextSelect}
                      isSelected={selectedTextId === text.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="relative flex rounded overflow-hidden border h-8">
              {templateSlots.map((slot) => (
                <div
                  key={`empty-slot-${slot.id}`}
                  className="relative border-r border-gray-200 last:border-r-0 bg-gray-50"
                  style={{
                    width: `${(slot.duration / totalDuration) * 100}%`,
                    minWidth: '50px'
                  }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-gray-500">Text overlays will appear here</p>
              </div>
            </div>
          )}
        </div>

        <div className="relative flex rounded overflow-hidden border">
          {/* Progress indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 transition-all duration-100"
            style={{
              left: `${(currentTime / totalDuration) * 100}%`
            }}
          />
          {templateSlots.map((slot, index) => {
            const video = getVideoForSlot(slot.id)
            const isCurrentSlot = getCurrentSlot() === index && isPlaying

            return (
              <div
                key={slot.id}
                className={`relative border-r border-gray-200 last:border-r-0 h-12 transition-all duration-200 ${
                  video ? 'bg-white' : 'bg-gray-100'
                } ${
                  selectedSlot === slot.id ? 'ring-2 ring-[#09725c] ring-opacity-50' : ''
                } ${
                  dragOverSlot === slot.id ? 'ring-2 ring-[#ff914d] bg-orange-50' : ''
                } ${
                  isCurrentSlot ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                style={{
                  width: `${(slot.duration / totalDuration) * 100}%`,
                  minWidth: '50px'
                }}
                onClick={() => setSelectedSlot(slot.id)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverSlot(slot.id)
                }}
                onDragLeave={() => setDragOverSlot(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggedVideo) {
                    if (canVideoFitSlot(draggedVideo, slot)) {
                      assignVideoToSlot(slot.id, draggedVideo.id)
                    } else {
                      alert(`This video (${draggedVideo.duration}s) is too short for this slot (${slot.duration}s)`)
                    }
                    setDragOverSlot(null)
                  }
                }}
              >
                {video ? (
                  <>
                    <img
                      src={video.thumbnail_url || '/placeholder-video.jpg'}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white px-1">
                      <p className="text-xs truncate">{slot.duration.toFixed(1)}s</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Video className="w-3 h-3 mb-1" />
                    <p className="text-xs">{slot.duration.toFixed(1)}s</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

        </>
      )}
    </div>
  )
}