'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause, Type, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CanvasVideoEditorMasterclass } from './canvas-video-editor-masterclass'

interface VideoSlot {
  id: string
  order: number
  duration: number
  description: string
  start_time: number
  end_time: number
  assignedVideo?: {
    title: string
    thumbnail_url: string
  }
}

interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: { x: number; y: number; anchor: string }
  style: {
    font_family: string
    font_size: number
    color: string
    bold: boolean
    italic: boolean
    shadow: boolean
    outline: boolean
    background: boolean
    opacity: number
  }
  textAlign?: 'left' | 'center' | 'right'
}

interface TimelineVideoScrubberProps {
  videoSlots: VideoSlot[]
  textOverlays: TextOverlay[]
  setTextOverlays: (overlays: TextOverlay[]) => void
  selectedTextId: string | null
  setSelectedTextId: (id: string | null) => void
  currentTime: number
  totalDuration: number
  onTimeChange: (time: number) => void
  onPlay?: () => void
  onPause?: () => void
  isPlaying?: boolean
  editorWidth?: number
  editorHeight?: number
  onShowTextEditor?: () => void
}

export function TimelineVideoScrubber({
  videoSlots,
  textOverlays,
  setTextOverlays,
  selectedTextId,
  setSelectedTextId,
  currentTime,
  totalDuration,
  onTimeChange,
  onPlay,
  onPause,
  isPlaying = false,
  editorWidth = 270,
  editorHeight = 480,
  onShowTextEditor
}: TimelineVideoScrubberProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const scrubberRef = useRef<HTMLDivElement>(null)

  // Obtenir l'image de fond correspondant au temps actuel - EXACTEMENT comme le système backend
  const getCurrentBackgroundImage = useCallback((time: number) => {
    // Trouver le slot correspondant au temps actuel
    for (const slot of videoSlots) {
      if (time >= slot.start_time && time < slot.end_time) {
        if (slot.assignedVideo?.thumbnail_url) {
          return `url(${slot.assignedVideo.thumbnail_url})`
        } else {
          return 'linear-gradient(135deg, #09725c 0%, #ff914d 100%)'
        }
      }
    }
    return 'linear-gradient(135deg, #09725c 0%, #ff914d 100%)'
  }, [videoSlots])

  // Obtenir les textes visibles au temps actuel
  const getVisibleTexts = useCallback((time: number) => {
    return textOverlays.filter(text => 
      time >= text.start_time && time <= text.end_time
    )
  }, [textOverlays])

  // Calculer la position du scrubber
  const getScrubberPosition = useCallback((time: number) => {
    return Math.max(0, Math.min(100, (time / totalDuration) * 100))
  }, [totalDuration])

  // Convertir pixels en temps
  const pixelsToTime = useCallback((pixels: number, containerWidth: number) => {
    return Math.max(0, Math.min(totalDuration, (pixels / containerWidth) * totalDuration))
  }, [totalDuration])

  // Gérer le clic sur la timeline
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current) return
    
    const rect = scrubberRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = pixelsToTime(clickX, rect.width)
    
    onTimeChange(newTime)
  }, [pixelsToTime, onTimeChange])

  // Gérer le début du drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    handleTimelineClick(e)
  }, [handleTimelineClick])

  // Gérer le drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrubberRef.current) return
    
    const rect = scrubberRef.current.getBoundingClientRect()
    const moveX = e.clientX - rect.left
    const newTime = pixelsToTime(moveX, rect.width)
    
    onTimeChange(newTime)
  }, [isDragging, pixelsToTime, onTimeChange])

  // Gérer la fin du drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Gérer le hover pour preview
  const handleMouseHover = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current || isDragging) return
    
    const rect = scrubberRef.current.getBoundingClientRect()
    const hoverX = e.clientX - rect.left
    const hoverTime = pixelsToTime(hoverX, rect.width)
    
    setHoveredTime(hoverTime)
  }, [pixelsToTime, isDragging])

  // Gérer la sortie du hover
  const handleMouseLeave = useCallback(() => {
    setHoveredTime(null)
  }, [])

  // Attacher les événements globaux
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Calculer la position du scrubber actuel
  const scrubberPosition = getScrubberPosition(currentTime)
  const previewTime = hoveredTime !== null ? hoveredTime : currentTime
  const backgroundImage = getCurrentBackgroundImage(previewTime)
  const visibleTexts = getVisibleTexts(previewTime)

  return (
    <div className="space-y-4">
      {/* Canvas Video Editor Masterclass */}
      <CanvasVideoEditorMasterclass
        videoSlots={videoSlots}
        textOverlays={textOverlays}
        setTextOverlays={setTextOverlays}
        selectedTextId={selectedTextId}
        setSelectedTextId={setSelectedTextId}
        currentTime={previewTime}
        totalDuration={totalDuration}
        onTimeChange={onTimeChange}
        onPlay={onPlay}
        onPause={onPause}
        isPlaying={isPlaying}
      />


      {/* Timeline scrubber */}
      <div className="space-y-2">
        <div 
          ref={scrubberRef}
          className="relative h-16 bg-gray-200 rounded-lg cursor-pointer select-none overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseHover}
          onMouseLeave={handleMouseLeave}
        >
          {/* Segments vidéo avec thumbnails */}
          <div className="absolute inset-0 flex">
            {videoSlots.map((slot) => {
              const width = (slot.duration / totalDuration) * 100
              return (
                <div
                  key={slot.id}
                  className="relative border-r-2 border-gray-400 last:border-r-0 overflow-hidden h-full"
                  style={{ width: `${width}%` }}
                >
                  {slot.assignedVideo?.thumbnail_url ? (
                    <img
                      src={slot.assignedVideo.thumbnail_url}
                      alt={slot.assignedVideo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-xs text-gray-600 font-medium">Slot {slot.order}</div>
                        <div className="text-xs text-gray-500">{slot.duration.toFixed(1)}s</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Overlays de texte sur la timeline */}
          {textOverlays.map((text) => {
            const left = (text.start_time / totalDuration) * 100
            const width = ((text.end_time - text.start_time) / totalDuration) * 100
            
            return (
              <div
                key={text.id}
                className="absolute top-0 h-1 bg-[#ff914d] opacity-70"
                style={{
                  left: `${left}%`,
                  width: `${width}%`
                }}
                title={text.content}
              />
            )
          })}

          {/* Curseur de position actuelle */}
          <div
            className="absolute top-0 w-0.5 h-full bg-blue-500 pointer-events-none"
            style={{
              left: `${scrubberPosition}%`,
              transform: 'translateX(-50%)'
            }}
          />

          {/* Indicateur de hover */}
          {hoveredTime !== null && !isDragging && (
            <div
              className="absolute top-0 w-0.5 h-full bg-yellow-400 pointer-events-none opacity-75"
              style={{
                left: `${getScrubberPosition(hoveredTime)}%`,
                transform: 'translateX(-50%)'
              }}
            />
          )}
        </div>

        {/* Labels de temps */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>0s</span>
          <span>{totalDuration.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  )
}