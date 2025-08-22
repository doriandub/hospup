'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Plus,
  Trash2,
  Edit,
  Move,
  Clock,
  Video,
  Shuffle,
  Check,
  AlertCircle,
  Zap,
  Download
} from 'lucide-react'

interface VideoSegment {
  id: string
  order: number
  duration: number
  description: string
  start_time: number
  end_time: number
  matched_video?: {
    id: string
    title: string
    thumbnail_url: string
    video_url: string
    duration: number
  }
  confidence_score?: number
}

interface ContentLibraryVideo {
  id: string
  title: string
  thumbnail_url: string
  video_url: string
  duration: number
  description: string
}

interface TextOverlay {
  id: string
  content: string
  start_time: number
  end_time: number
  position: 'top' | 'center' | 'bottom'
  font_family: string
  font_size: number
  color: string
  has_shadow: boolean
  has_outline: boolean
}

interface VideoComposerProps {
  templateId: string
  templateTitle: string
  templateDuration: number
  initialSegments: VideoSegment[]
  contentLibrary: ContentLibraryVideo[]
  propertyName: string
  language: string
  onGenerate: (segments: VideoSegment[], texts: TextOverlay[]) => void
}

export function VideoComposer({
  templateId,
  templateTitle,
  templateDuration,
  initialSegments,
  contentLibrary,
  propertyName,
  language,
  onGenerate
}: VideoComposerProps) {
  const [segments, setSegments] = useState<VideoSegment[]>(initialSegments)
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [draggedVideo, setDraggedVideo] = useState<ContentLibraryVideo | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Calculate timeline statistics
  const totalSegments = segments.length
  const matchedSegments = segments.filter(s => s.matched_video).length
  const matchPercentage = totalSegments > 0 ? (matchedSegments / totalSegments) * 100 : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSegmentColor = (segment: VideoSegment) => {
    if (!segment.matched_video) return 'bg-gray-200 border-gray-300'
    if ((segment.confidence_score || 0) > 0.7) return 'bg-green-100 border-green-300'
    if ((segment.confidence_score || 0) > 0.4) return 'bg-yellow-100 border-yellow-300'
    return 'bg-orange-100 border-orange-300'
  }

  const handleDrop = (segmentId: string, droppedVideo: ContentLibraryVideo) => {
    setSegments(segments.map(segment => 
      segment.id === segmentId 
        ? { 
            ...segment, 
            matched_video: droppedVideo,
            confidence_score: 0.9 // High confidence for manual assignment
          }
        : segment
    ))
  }

  const removeVideoFromSegment = (segmentId: string) => {
    setSegments(segments.map(segment => 
      segment.id === segmentId 
        ? { ...segment, matched_video: undefined, confidence_score: 0 }
        : segment
    ))
  }

  const swapSegments = (index1: number, index2: number) => {
    const newSegments = [...segments]
    ;[newSegments[index1], newSegments[index2]] = [newSegments[index2], newSegments[index1]]
    
    // Update order and timing
    let currentTime = 0
    newSegments.forEach((segment, index) => {
      segment.order = index + 1
      segment.start_time = currentTime
      segment.end_time = currentTime + segment.duration
      currentTime += segment.duration
    })
    
    setSegments(newSegments)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{templateTitle}</h1>
            <p className="text-gray-600">Composez votre vidéo • {formatTime(templateDuration)}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {matchedSegments}/{totalSegments} segments ({matchPercentage.toFixed(0)}%)
            </div>
            <Button
              onClick={() => onGenerate(segments, textOverlays)}
              disabled={matchedSegments === 0}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Zap className="w-4 h-4 mr-2" />
              Générer la Vidéo
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Timeline Section */}
        <div className="flex-1 p-6">
          {/* Template Timeline */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Timeline du Template</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatTime(templateDuration)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${matchPercentage}%` }}
              ></div>
            </div>

            {/* Segments */}
            <div className="space-y-3">
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className={`relative border-2 rounded-lg p-4 transition-all duration-200 ${
                    getSegmentColor(segment)
                  } ${selectedSegment === segment.id ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
                  onClick={() => setSelectedSegment(segment.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedVideo) {
                      handleDrop(segment.id, draggedVideo)
                      setDraggedVideo(null)
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    {/* Segment Number */}
                    <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {segment.order}
                    </div>

                    {/* Timing */}
                    <div className="text-sm font-medium text-gray-700 min-w-0">
                      {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                      <div className="text-xs text-gray-500">{segment.duration}s</div>
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{segment.description}</p>
                    </div>

                    {/* Matched Video or Drop Zone */}
                    <div className="w-32 h-20 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center relative">
                      {segment.matched_video ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={segment.matched_video.thumbnail_url || '/placeholder-video.jpg'}
                            alt={segment.matched_video.title}
                            className="w-full h-full object-cover rounded"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeVideoFromSegment(segment.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {/* Confidence indicator */}
                          <div className="absolute top-1 right-1">
                            {(segment.confidence_score || 0) > 0.7 ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (segment.confidence_score || 0) > 0.4 ? (
                              <AlertCircle className="w-3 h-3 text-yellow-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-orange-500" />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Video className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">Glissez une vidéo ici</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            swapSegments(index, index - 1)
                          }}
                        >
                          ↑
                        </Button>
                      )}
                      {index < segments.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            swapSegments(index, index + 1)
                          }}
                        >
                          ↓
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Text Overlays Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Textes de la Vidéo</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newText: TextOverlay = {
                    id: Date.now().toString(),
                    content: "Nouveau texte",
                    start_time: 0,
                    end_time: 3,
                    position: 'center',
                    font_family: 'system-ui',
                    font_size: 24,
                    color: '#FFFFFF',
                    has_shadow: true,
                    has_outline: false
                  }
                  setTextOverlays([...textOverlays, newText])
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Texte
              </Button>
            </div>

            {textOverlays.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun texte ajouté</p>
                <p className="text-sm">Cliquez sur "Ajouter Texte" pour commencer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {textOverlays.map((text) => (
                  <div key={text.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{text.content}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(text.start_time)} - {formatTime(text.end_time)} • {text.position}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTextOverlays(textOverlays.filter(t => t.id !== text.id))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Library Sidebar */}
        <div className="w-80 bg-white border-l p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Content Library</h2>
            <div className="text-sm text-gray-600">{contentLibrary.length} vidéos</div>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {contentLibrary.map((video) => (
              <div
                key={video.id}
                className="bg-gray-50 rounded-lg p-3 cursor-move hover:bg-gray-100 transition-colors"
                draggable
                onDragStart={() => setDraggedVideo(video)}
                onDragEnd={() => setDraggedVideo(null)}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={video.thumbnail_url || '/placeholder-video.jpg'}
                    alt={video.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                    <p className="text-xs text-gray-500">{formatTime(video.duration)}</p>
                    {video.description && (
                      <p className="text-xs text-gray-400 truncate mt-1">{video.description}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Move className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {contentLibrary.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucune vidéo dans votre bibliothèque</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}